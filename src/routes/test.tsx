import HoverSelect from "#/components/hover-select";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/test")({
  component: RouteComponent,
});

function RouteComponent() {
  const items = [
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
    { name: "option 1", value: "1" },
  ];

  return <HoverSelect items={items} action={(value: any) => alert(value)} />;
}
