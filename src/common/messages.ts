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
  return value.type === "change" && !!(value as any).changed && Array.isArray((value as any).mkdir) && Array.isArray((value as any).removed);
}
