import { BUILT_IN_AGENT_IDS } from "./built-in-agents";

const USER_SYSTEM_PROMPT_CONTEXT_KEY = "user";
const POLICY_CONFIG_TOOL_CONTEXT_KEY = "tool";
const toTemplateExpression = (path: string) => `{{${path}}}`;

export const SYSTEM_PROMPT_VARIABLE_PATHS = {
  userName: `${USER_SYSTEM_PROMPT_CONTEXT_KEY}.name`,
  userEmail: `${USER_SYSTEM_PROMPT_CONTEXT_KEY}.email`,
  userTeams: `${USER_SYSTEM_PROMPT_CONTEXT_KEY}.teams`,
  memoryUser: `memory.user`,
  memoryTeam: `memory.team`,
  memoryOrganization: `memory.organization`,
} as const;

export const SYSTEM_PROMPT_VARIABLE_EXPRESSIONS = {
  userName: toTemplateExpression(SYSTEM_PROMPT_VARIABLE_PATHS.userName),
  userEmail: toTemplateExpression(SYSTEM_PROMPT_VARIABLE_PATHS.userEmail),
  userTeams: toTemplateExpression(SYSTEM_PROMPT_VARIABLE_PATHS.userTeams),
  memoryUser: toTemplateExpression(SYSTEM_PROMPT_VARIABLE_PATHS.memoryUser),
  memoryTeam: toTemplateExpression(SYSTEM_PROMPT_VARIABLE_PATHS.memoryTeam),
  memoryOrganization: toTemplateExpression(SYSTEM_PROMPT_VARIABLE_PATHS.memoryOrganization),
} as const;

/**
 * System prompt template variables and helpers available for Handlebars templating.
 * Used by both the backend (for rendering) and frontend (for documentation/UI hints).
 */

export const SYSTEM_PROMPT_VARIABLES = [
  {
    expression: SYSTEM_PROMPT_VARIABLE_EXPRESSIONS.userName,
    description: "Name of the user invoking the agent",
  },
  {
    expression: SYSTEM_PROMPT_VARIABLE_EXPRESSIONS.userEmail,
    description: "Email of the user invoking the agent",
  },
  {
    expression: SYSTEM_PROMPT_VARIABLE_EXPRESSIONS.userTeams,
    description: "Team names the user belongs to (array)",
  },
  {
    expression: SYSTEM_PROMPT_VARIABLE_EXPRESSIONS.memoryUser,
    description: "User-scoped durable memory (array of {key, value})",
  },
  {
    expression: SYSTEM_PROMPT_VARIABLE_EXPRESSIONS.memoryTeam,
    description: "Team-scoped durable memory (array of {key, value})",
  },
  {
    expression: SYSTEM_PROMPT_VARIABLE_EXPRESSIONS.memoryOrganization,
    description: "Organization-scoped durable memory (array of {key, value})",
  },
] as const;

export const SYSTEM_PROMPT_HELPER_NAMES = {
  currentDate: "currentDate",
  currentTime: "currentTime",
} as const;

export const SYSTEM_PROMPT_HELPER_EXPRESSIONS = {
  currentDate: toTemplateExpression(SYSTEM_PROMPT_HELPER_NAMES.currentDate),
  currentTime: toTemplateExpression(SYSTEM_PROMPT_HELPER_NAMES.currentTime),
} as const;

export const SYSTEM_PROMPT_HELPERS = [
  {
    expression: SYSTEM_PROMPT_HELPER_EXPRESSIONS.currentDate,
    description: "Current date in UTC (YYYY-MM-DD)",
  },
  {
    expression: SYSTEM_PROMPT_HELPER_EXPRESSIONS.currentTime,
    description: "Current time in UTC (HH:MM:SS UTC)",
  },
] as const;

/**
 * All available template expressions (variables + helpers) for display in the UI.
 */
export const SYSTEM_PROMPT_TEMPLATE_EXPRESSIONS = [
  ...SYSTEM_PROMPT_VARIABLES,
  ...SYSTEM_PROMPT_HELPERS,
] as const;

export const POLICY_CONFIG_SYSTEM_PROMPT_VARIABLE_PATHS = {
  toolName: `${POLICY_CONFIG_TOOL_CONTEXT_KEY}.name`,
  toolDescription: `${POLICY_CONFIG_TOOL_CONTEXT_KEY}.description`,
  toolParameters: `${POLICY_CONFIG_TOOL_CONTEXT_KEY}.parameters`,
  toolAnnotations: `${POLICY_CONFIG_TOOL_CONTEXT_KEY}.annotations`,
  mcpServerName: "mcpServerName",
} as const;

export const POLICY_CONFIG_SYSTEM_PROMPT_EXPRESSIONS = {
  toolName: toTemplateExpression(
    POLICY_CONFIG_SYSTEM_PROMPT_VARIABLE_PATHS.toolName,
  ),
  toolDescription: toTemplateExpression(
    POLICY_CONFIG_SYSTEM_PROMPT_VARIABLE_PATHS.toolDescription,
  ),
  toolParameters: toTemplateExpression(
    POLICY_CONFIG_SYSTEM_PROMPT_VARIABLE_PATHS.toolParameters,
  ),
  toolAnnotations: toTemplateExpression(
    POLICY_CONFIG_SYSTEM_PROMPT_VARIABLE_PATHS.toolAnnotations,
  ),
  mcpServerName: toTemplateExpression(
    POLICY_CONFIG_SYSTEM_PROMPT_VARIABLE_PATHS.mcpServerName,
  ),
} as const;

export const POLICY_CONFIG_SYSTEM_PROMPT_TEMPLATE_EXPRESSIONS = [
  {
    expression: POLICY_CONFIG_SYSTEM_PROMPT_EXPRESSIONS.toolName,
    description: "Name of the MCP tool being evaluated",
  },
  {
    expression: POLICY_CONFIG_SYSTEM_PROMPT_EXPRESSIONS.toolDescription,
    description: "Description of the MCP tool being evaluated",
  },
  {
    expression: POLICY_CONFIG_SYSTEM_PROMPT_EXPRESSIONS.toolParameters,
    description: "JSON schema for the MCP tool parameters",
  },
  {
    expression: POLICY_CONFIG_SYSTEM_PROMPT_EXPRESSIONS.toolAnnotations,
    description: "MCP tool annotations such as read-only or destructive hints",
  },
  {
    expression: POLICY_CONFIG_SYSTEM_PROMPT_EXPRESSIONS.mcpServerName,
    description: "Name of the MCP server that provides the tool",
  },
] as const;

export function buildPolicyConfigSystemPromptContext(params: {
  toolName: string;
  toolDescription: string;
  toolParameters: string;
  toolAnnotations: string;
  mcpServerName: string;
}) {
  return {
    [POLICY_CONFIG_TOOL_CONTEXT_KEY]: {
      name: params.toolName,
      description: params.toolDescription,
      parameters: params.toolParameters,
      annotations: params.toolAnnotations,
    },
    mcpServerName: params.mcpServerName,
  };
}

export interface UserSystemPromptContext {
  user: {
    name: string;
    email: string;
    teams: string[];
  };
  memory?: {
    user: Array<{ key: string; value: string }>;
    team: Array<{ key: string; value: string }>;
    organization: Array<{ key: string; value: string }>;
  };
}

export function buildUserSystemPromptContext(params: {
  userName: string;
  userEmail: string;
  userTeams: string[];
  user?: Array<{ key: string; value: string }>;
  team?: Array<{ key: string; value: string }>;
  organization?: Array<{ key: string; value: string }>;
}): UserSystemPromptContext {
  const ctx: UserSystemPromptContext = {
    [USER_SYSTEM_PROMPT_CONTEXT_KEY]: {
      name: params.userName,
      email: params.userEmail,
      teams: params.userTeams,
    },
  };

  if (params.user?.length || params.team?.length || params.organization?.length) {
    ctx.memory = {
      user: params.user ?? [],
      team: params.team ?? [],
      organization: params.organization ?? [],
    };
  }

  return ctx;
}

export function getSystemPromptTemplateExpressions(params?: {
  builtInAgentId?: string | null;
}) {
  if (params?.builtInAgentId === BUILT_IN_AGENT_IDS.POLICY_CONFIG) {
    return [
      ...SYSTEM_PROMPT_TEMPLATE_EXPRESSIONS,
      ...POLICY_CONFIG_SYSTEM_PROMPT_TEMPLATE_EXPRESSIONS,
    ];
  }

  return SYSTEM_PROMPT_TEMPLATE_EXPRESSIONS;
}
