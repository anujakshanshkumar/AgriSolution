param(
    [Parameter(Mandatory=$true)][string]$ApiUrl,
    [string]$ToolRoot = "$env:USERPROFILE\.cache\agri-android",
    [ValidateSet('arm64-v8a','armeabi-v7a','x86_64')][string]$Architecture = 'arm64-v8a',
    [string]$BuildDirectory = (Join-Path ($env:SystemDrive + '\') ('agri-apk-' + [guid]::NewGuid().ToString('N').Substring(0,8)))
)
$ErrorActionPreference = 'Stop'
$mobileRoot = Split-Path -Parent $PSScriptRoot
$jdk = Get-ChildItem -LiteralPath (Join-Path $ToolRoot 'jdk') -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'bin\java.exe') } | Select-Object -First 1
if (-not $jdk) { throw "A JDK is required under $ToolRoot\jdk. See README.md." }
$sdk = Join-Path $ToolRoot 'sdk'
if (-not (Test-Path (Join-Path $sdk 'build-tools\37.0.0\apksigner.bat'))) { throw "Android Build Tools 37.0.0 are missing from $sdk." }
$parsedUrl = [uri]$ApiUrl
if (-not $parsedUrl.IsAbsoluteUri -or $parsedUrl.Scheme -notin @('http','https') -or $parsedUrl.UserInfo -or $parsedUrl.Query -or $parsedUrl.Fragment -or $parsedUrl.AbsolutePath -ne '/') { throw 'Supply an HTTP(S) portal origin without credentials, path, query or fragment.' }
$stage = [IO.Path]::GetFullPath($BuildDirectory)
if (Test-Path -LiteralPath $stage) { throw "BuildDirectory must be a new directory outside OneDrive: $stage" }
if ($stage -match '(?i)[\\/]OneDrive(?:[\\/]|$)') { throw 'BuildDirectory must be outside OneDrive.' }
$artifacts = Join-Path $mobileRoot 'artifacts'
New-Item -ItemType Directory -Force -Path $artifacts | Out-Null
$log = Join-Path $artifacts 'android-build.log'
if (Test-Path -LiteralPath $log) { Copy-Item -LiteralPath $log -Destination (Join-Path $artifacts ('android-build-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')) }
New-Item -ItemType Directory -Path $stage | Out-Null
# Copy source only. Native projects and node_modules are generated independently;
# linking OneDrive node_modules back into this directory defeats the isolation.
foreach ($name in @('src','assets','tests','scripts','package.json','package-lock.json','app.config.ts','tsconfig.json','eslint.config.js','AGENTS.md')) {
    Copy-Item -LiteralPath (Join-Path $mobileRoot $name) -Destination $stage -Recurse
}
Write-Host "Isolated Android build directory: $stage"
$savedEnvironment = @{}
foreach ($name in @('JAVA_HOME','ANDROID_HOME','ANDROID_SDK_ROOT','EXPO_PUBLIC_API_URL','EXPO_PUBLIC_ALLOW_HTTP','NODE_ENV')) { $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
Push-Location $stage
try {
    $env:JAVA_HOME = $jdk.FullName
    $env:ANDROID_HOME = $sdk
    $env:ANDROID_SDK_ROOT = $sdk
    $env:EXPO_PUBLIC_API_URL = $ApiUrl.TrimEnd('/')
    $env:EXPO_PUBLIC_ALLOW_HTTP = if($parsedUrl.Scheme -eq 'http') {'true'} else {'false'}
    $env:NODE_ENV = 'production'
    & npm.cmd ci --include=dev --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Installing isolated build dependencies failed.' }
    if ((Get-Item -LiteralPath (Join-Path $stage 'node_modules')).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Build dependencies must not be a junction or symbolic link.' }
    & npx.cmd --no-install expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
    # Expo's generated release variant embeds JS and uses its development signing key.
    # This is an installable test APK, not a store release signed with a private key.
    $ErrorActionPreference = 'Continue'
    & (Join-Path $jdk.FullName 'bin\java.exe') -jar 'android\gradle\wrapper\gradle-wrapper.jar' -p android assembleRelease "-PreactNativeArchitectures=$Architecture" '-Pkotlin.compiler.execution.strategy=in-process' --no-daemon --console=plain --max-workers=2 2>&1 | Tee-Object -FilePath $log
    $buildExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($buildExit -ne 0) { throw "Android build failed (exit $buildExit). Log: $log" }
    $source = Join-Path $stage 'android\app\build\outputs\apk\release\app-release.apk'
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Gradle returned without producing app-release.apk.' }
    & (Join-Path $sdk 'build-tools\37.0.0\apksigner.bat') verify --verbose --print-certs $source
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    $destination = Join-Path $mobileRoot "artifacts\agri-solution-preview-$Architecture.apk"
    Copy-Item -LiteralPath $source -Destination $destination -Force
    Get-Item -LiteralPath $destination | Select-Object FullName,Length,LastWriteTime
    Get-FileHash -LiteralPath $destination -Algorithm SHA256
} finally {
    Pop-Location
    foreach ($name in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name,$savedEnvironment[$name],'Process') }
}
