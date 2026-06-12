import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/sse-test")({
  component: RouteComponent,
});

function RouteComponent() {
  useEffect(() => {
    const eventSource = new EventSource("/api/sse/");

    eventSource.onmessage = (event) => {
      let msg = JSON.parse(event.data)?.message;
      let i = 1;
      for (let c of msg) {
        setTimeout(() => setContent((prev) => prev + c), i);
        i += 7;
      }
    };
    return () => eventSource.close();
  });

  const [content, setContent] = useState("thinking");

  return <div> {content} </div>;
}
