/**
 * Linear GraphQL API — create issues linked to platform support tickets
 *
 * Purpose: Issue tracking; engineering uses Linear while tenants use in-app support.
 * Location: /lib/integrations/linear.ts
 *
 * Env: LINEAR_API_KEY (Personal API key from Linear Settings → API), LINEAR_TEAM_ID (UUID of team)
 *
 * @see https://developers.linear.app/docs/graphql/working-with-the-graphql-api
 */

const LINEAR_API = 'https://api.linear.app/graphql';

export type LinearIssueResult = { id: string; identifier: string; url: string };

export function isLinearConfigured(): boolean {
  return Boolean(process.env.LINEAR_API_KEY?.trim() && process.env.LINEAR_TEAM_ID?.trim());
}

/**
 * Create a Linear issue from a support ticket (idempotent if caller checks DB first).
 */
export async function createLinearIssueForSupportTicket(input: {
  ticketId: string;
  subject: string;
  description: string;
  priority?: string;
}): Promise<LinearIssueResult> {
  const key = process.env.LINEAR_API_KEY?.trim();
  const teamId = process.env.LINEAR_TEAM_ID?.trim();
  if (!key || !teamId) {
    throw new Error('Linear is not configured (LINEAR_API_KEY, LINEAR_TEAM_ID)');
  }

  const title = `[Hotel Etuna Support] ${input.subject}`.slice(0, 250);
  const description = [
    `**Support ticket ID:** \`${input.ticketId}\``,
    `**Priority (app):** ${input.priority ?? 'n/a'}`,
    '',
    input.description,
  ].join('\n');

  const gql = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: key,
    },
    body: JSON.stringify({
      query: gql,
      variables: {
        input: {
          teamId,
          title,
          description,
        },
      },
    }),
  });

  const json = (await res.json()) as {
    errors?: { message: string }[];
    data?: { issueCreate?: { success: boolean; issue?: LinearIssueResult } };
  };

  if (!res.ok) {
    console.error('[Linear] HTTP error', res.status, json);
    throw new Error(`Linear API HTTP ${res.status}`);
  }
  if (json.errors?.length) {
    console.error('[Linear] GraphQL errors', json.errors);
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }

  const issue = json.data?.issueCreate?.issue;
  if (!json.data?.issueCreate?.success || !issue?.id || !issue.url) {
    throw new Error('Linear issueCreate returned no issue');
  }

  return { id: issue.id, identifier: issue.identifier, url: issue.url };
}
