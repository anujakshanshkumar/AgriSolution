import React from "react";
import { usePortal } from "../hooks/PortalProvider";
import { Content } from "../types";
import { Feedback, Screen } from "./ui";
export function ContentScreen({
  children,
}: {
  children: (content: Content) => React.ReactNode;
}) {
  const { content } = usePortal();
  return (
    <Screen refreshing={content.loading} onRefresh={content.refresh}>
      <Feedback
        error={content.error}
        loading={content.loading && !content.data}
        retry={content.refresh}
      />
      {content.data && children(content.data)}
    </Screen>
  );
}
