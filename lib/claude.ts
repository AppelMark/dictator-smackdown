interface CommentaryRequest {
  archetype: string;
  event: string;
  context: string;
}

interface CommentaryResponse {
  commentary: string;
}

export async function generateCommentary(
  request: CommentaryRequest
): Promise<CommentaryResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  // Placeholder for Claude API integration
  return { commentary: `${request.event} - ${request.archetype}` };
}
