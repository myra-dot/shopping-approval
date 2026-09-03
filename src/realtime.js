export function subscribeToRoomRequests({ supabase, roomId, onChange }) {
  if (!supabase || !roomId) return { unsubscribe: async () => {} };
  const filter = `room_id=eq.${roomId}`;
  const channel = supabase
    .channel(`purchase-requests:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchase_requests', filter }, onChange)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'purchase_requests', filter }, onChange)
    .subscribe();
  return {
    unsubscribe: async () => {
      await supabase.removeChannel(channel);
    }
  };
}
