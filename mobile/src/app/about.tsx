import { ContentScreen } from "../components/ContentScreen";
import { Card, Copy } from "../components/ui";
export default function About() {
  return (
    <ContentScreen>
      {(content) => (
        <>
          <Copy title>About Agri-Solution</Copy>
          {content.about.map((item, i) => (
            <Copy key={i} title={item.heading}>
              {item.text}
            </Copy>
          ))}
          <Card>
            <Copy muted>{content.disclaimer}</Copy>
          </Card>
        </>
      )}
    </ContentScreen>
  );
}
