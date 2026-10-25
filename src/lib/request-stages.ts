export const requestStages = {
  inquiry: ["new", "contacted", "quoted", "accepted", "completed", "cancelled"],
  appointment: ["requested", "confirmed", "completed", "cancelled"],
} as const
export type RequestKind = keyof typeof requestStages
export function validStage(kind: RequestKind, stage: unknown): stage is string {
  return typeof stage === "string" && (requestStages[kind] as readonly string[]).includes(stage)
}
