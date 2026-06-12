import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sse/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let clockSig: ReturnType<typeof setInterval>;
        const stream = new ReadableStream({
          start(controller) {
            // controller.enqueue('data: {"message": "Hello"}\n\n');
            clockSig = setInterval(() => {
              try {
                controller.enqueue(
                  'data: {"message": "Yada REaling ly gadfalksdf   yayayaya a tampoynya!!"}\n\n',
                );
              } catch {
                clearInterval(clockSig);
              }
            }, 100);
          },
          cancel() {
            clearInterval(clockSig);
          },
        });

        return new Response(stream, {
          headers: {
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
