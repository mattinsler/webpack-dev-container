export interface Message {
  type: string;
}

export interface ChangeMessage {
  type: "change";
  changed: {
    [file: string]: Buffer;
  };
  mkdir: string[];
  removed: string[];
}

export function isChangeMessage(value: Message): value is ChangeMessage {
  return (
    value.type === "change" &&
    !!(value as any).changed &&
    Array.isArray((value as any).mkdir) &&
    Array.isArray((value as any).removed)
  );
}

export interface LogMessage {
  type: "log";
  stream: "stderr" | "stdout";
  text: string;
}

export function isLogMessage(value: Message): value is LogMessage {
  return (
    value.type === "log" &&
    ["stderr", "stdout"].indexOf((value as any).stream) !== -1 &&
    typeof (value as any).text === "string"
  );
}

export interface TaskMessage {
  type: "task";
  operation: "begin" | "end";
  name: string;
  taskId: number;
}

export function isTaskMessage(value: Message): value is TaskMessage {
  return (
    value.type === "task" &&
    ["begin", "end"].indexOf((value as any).operation) !== -1 &&
    typeof (value as any).name === "string" &&
    typeof (value as any).taskId === "number"
  );
}
