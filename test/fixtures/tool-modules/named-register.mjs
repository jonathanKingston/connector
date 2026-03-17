export function registerTools(server) {
  server.tool(
    "custom_ping",
    "Fixture custom ping tool",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: "pong",
        },
      ],
    }),
  );
}
