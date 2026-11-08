import { pushStorage } from "../storage/jsonStore";

export interface PushSubscriptionItem {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  updatedAt: string;
}

export async function getAllPushSubscriptions(): Promise<PushSubscriptionItem[]> {
  try {
    return await pushStorage.read();
  } catch (err) {
    console.error("[pushStorage] Error reading subscriptions:", err);
    return [];
  }
}

export async function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
}): Promise<PushSubscriptionItem> {
  const newItem: PushSubscriptionItem = {
    ...sub,
    updatedAt: new Date().toISOString(),
  };

  await pushStorage.update((list: PushSubscriptionItem[]) => {
    const index = list.findIndex((s) => s.endpoint === sub.endpoint);
    if (index !== -1) {
      list[index] = newItem;
    } else {
      list.push(newItem);
    }
    return list;
  });

  return newItem;
}

export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  let removed = false;
  await pushStorage.update((list: PushSubscriptionItem[]) => {
    const initialLen = list.length;
    const filtered = list.filter((s) => s.endpoint !== endpoint);
    if (filtered.length !== initialLen) {
      removed = true;
    }
    return filtered;
  });
  return removed;
}
