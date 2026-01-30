import { supabase } from './supabase';
import type { ChatRoom, ChatMessage, ChatRoomWithDetails } from '../types/database.types';

// 채팅방 생성 또는 가져오기 (Fetch API)
export function getOrCreateChatRoom(productId: string, sellerId: string): Promise<ChatRoom> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) throw new Error('로그인이 필요합니다.');
  
  const session = JSON.parse(sessionStr);
  const user = session?.user;
  
  if (!user) throw new Error('로그인이 필요합니다.');
  if (user.id === sellerId) throw new Error('자신의 상품에는 채팅할 수 없습니다.');

  const accessToken = session.access_token;

  // 기존 채팅방 확인
  return fetch(`${supabaseUrl}/rest/v1/chat_rooms?product_id=eq.${productId}&buyer_id=eq.${user.id}&seller_id=eq.${sellerId}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(rooms => {
      if (rooms && rooms.length > 0) {
        console.log('✅ 기존 채팅방 사용:', rooms[0].id);
        return rooms[0] as ChatRoom;
      }
      
      // 새 채팅방 생성
      console.log('📝 새 채팅방 생성...');
      return fetch(`${supabaseUrl}/rest/v1/chat_rooms`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          product_id: productId,
          buyer_id: user.id,
          seller_id: sellerId,
        }),
      })
        .then(response => response.json())
        .then(data => {
          const room = Array.isArray(data) ? data[0] : data;
          console.log('✅ 채팅방 생성 완료:', room.id);
          return room as ChatRoom;
        });
    });
}

// 내 채팅방 목록 가져오기 (Fetch API - 완전히 .then() 방식)
export function getMyChatRooms(): Promise<ChatRoomWithDetails[]> {
  // localStorage에서 사용자 가져오기
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) {
    console.error('❌ 세션 없음 (getMyChatRooms)');
    throw new Error('로그인이 필요합니다.');
  }
  
  type SessionShape = { user?: { id: string }; access_token?: string };
  let user: { id: string };
  let accessToken: string;

  try {
    const session = JSON.parse(sessionStr) as SessionShape;
    const u = session?.user;
    const tok = session?.access_token;
    if (!u || !tok) {
      console.error('❌ 유저 또는 토큰 없음 (getMyChatRooms)');
      throw new Error('로그인이 필요합니다.');
    }
    user = u;
    accessToken = tok;

    console.log('📦 채팅방 목록 가져오기 시작...');
    console.log('👤 사용자 ID:', user.id);

    // 두 가지 쿼리를 병합: buyer인 채팅방 + seller인 채팅방
    const buyerUrl = `${supabaseUrl}/rest/v1/chat_rooms?buyer_id=eq.${user.id}&order=updated_at.desc`;
    const sellerUrl = `${supabaseUrl}/rest/v1/chat_rooms?seller_id=eq.${user.id}&order=updated_at.desc`;
    
    console.log('🔗 buyer 쿼리:', buyerUrl);
    console.log('🔗 seller 쿼리:', sellerUrl);

    // 두 쿼리를 병렬로 실행
    return Promise.all([
    fetch(buyerUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()),
    fetch(sellerUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()),
  ])
    .then(([buyerRooms, sellerRooms]) => {
      // 두 결과를 합치고 중복 제거
      const allRooms = [...buyerRooms, ...sellerRooms];
      const uniqueRooms = Array.from(new Map(allRooms.map(room => [room.id, room])).values());
      
      console.log('📦 buyer 채팅방:', buyerRooms.length);
      console.log('📦 seller 채팅방:', sellerRooms.length);
      console.log('📦 전체 채팅방:', uniqueRooms.length);
      
      return uniqueRooms;
    })
    .then((rooms) => {
      // 각 채팅방에 대해 상품 정보, 마지막 메시지, 읽지 않은 메시지 개수 가져오기
      const roomPromises = rooms.map((room: any) => {
        // 1. 상품 정보 가져오기
        const productPromise = fetch(`${supabaseUrl}/rest/v1/products?id=eq.${room.product_id}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
          },
        }).then(response => response.json());

        // 2. 마지막 메시지 가져오기
        const lastMessagePromise = fetch(`${supabaseUrl}/rest/v1/chat_messages?room_id=eq.${room.id}&order=created_at.desc&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
          },
        }).then(response => response.json());

        // 3. 읽지 않은 메시지 개수 가져오기
        const unreadCountPromise = fetch(`${supabaseUrl}/rest/v1/chat_messages?room_id=eq.${room.id}&sender_id=neq.${user.id}&is_read=eq.false&select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'count=exact',
          },
        }).then(response => {
          const count = response.headers.get('content-range');
          if (count) {
            const match = count.match(/\/(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          }
          return response.json().then(data => Array.isArray(data) ? data.length : 0);
        });

        return Promise.all([productPromise, lastMessagePromise, unreadCountPromise])
          .then(([products, messages, unreadCount]) => {
            const product = products[0];
            const lastMessage = messages[0];
            
            console.log('✅ 상품:', product?.title, '| 마지막 메시지:', lastMessage?.message?.substring(0, 20), '| 읽지 않음:', unreadCount);
            
            return {
              ...room,
              product,
              last_message: lastMessage || undefined,
              unread_count: unreadCount,
            } as ChatRoomWithDetails;
          });
      });

      return Promise.all(roomPromises);
    })
    .then(roomsWithDetails => {
      console.log('✅ 채팅방 목록 완료:', roomsWithDetails.length);
      return roomsWithDetails;
    })
    .catch(error => {
      console.error('❌ getMyChatRooms 전체 에러:', error);
      throw error;
    });
  } catch (error) {
    console.error('❌ getMyChatRooms 초기화 에러:', error);
    throw error;
  }
}

// 판매확정: 이 채팅방에서 구매자에게 판매 확정. 판매자만 호출 가능.
export function confirmSaleInRoom(roomId: string): Promise<ChatRoom> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);

  if (!sessionStr) throw new Error('로그인이 필요합니다.');

  const session = JSON.parse(sessionStr);
  const user = session?.user;
  const accessToken = session?.access_token;

  if (!user || !accessToken) throw new Error('로그인이 필요합니다.');

  const now = new Date().toISOString();

  return fetch(`${supabaseUrl}/rest/v1/chat_rooms?id=eq.${roomId}`, {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then((r) => r.json())
    .then((rooms: ChatRoom[]) => {
      const room = rooms[0];
      if (!room) throw new Error('채팅방을 찾을 수 없습니다.');
      if (room.seller_id !== user.id) throw new Error('판매자만 판매확정할 수 있습니다.');
      if (room.sale_confirmed_at) throw new Error('이미 판매확정된 채팅입니다.');
      return room;
    })
    .then((room) => {
      return fetch(
        `${supabaseUrl}/rest/v1/chat_rooms?sale_confirmed_at=not.is.null&product_id=eq.${room.product_id}`,
        {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
        .then((r) => r.json())
        .then((existing: ChatRoom[]) => {
          if (existing && existing.length > 0) {
            throw new Error('이 상품은 이미 다른 분에게 판매확정되었습니다.');
          }
          return room;
        });
    })
    .then((room) => {
      return fetch(`${supabaseUrl}/rest/v1/chat_rooms?id=eq.${roomId}`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ sale_confirmed_at: now, updated_at: now }),
      })
        .then((r) => r.json())
        .then((data) => {
          const updated = Array.isArray(data) ? data[0] : data;
          return updated as ChatRoom;
        });
    })
    .then((updatedRoom) => {
      return fetch(`${supabaseUrl}/rest/v1/products?id=eq.${updatedRoom.product_id}`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ status: 'sold', updated_at: now }),
      })
        .then((r) => r.json())
        .then(() => updatedRoom);
    });
}

// 상품에 대해 판매확정된 구매자 ID (리뷰 작성 권한 검증용). 없으면 null.
export function getConfirmedBuyerForProduct(productId: string): Promise<string | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  const accessToken = sessionStr ? JSON.parse(sessionStr)?.access_token : supabaseKey;

  return fetch(
    `${supabaseUrl}/rest/v1/chat_rooms?product_id=eq.${productId}&sale_confirmed_at=not.is.null&select=buyer_id`,
    {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )
    .then((r) => r.json())
    .then((rows: { buyer_id: string }[]) => {
      if (rows && rows.length > 0) return rows[0].buyer_id;
      return null;
    })
    .catch(() => null);
}

// 채팅방 메시지 가져오기 (Fetch API)
export function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) return Promise.resolve([]);
  
  const session = JSON.parse(sessionStr);
  const accessToken = session?.access_token;
  
  if (!accessToken) return Promise.resolve([]);
  
  return fetch(`${supabaseUrl}/rest/v1/chat_messages?room_id=eq.${roomId}&order=created_at.asc`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      if (!Array.isArray(data)) return [];
      return data as ChatMessage[];
    })
    .catch(() => []);
}

// 메시지 전송 (Fetch API)
export function sendMessage(roomId: string, message: string): Promise<ChatMessage> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) throw new Error('로그인이 필요합니다.');
  
  const session = JSON.parse(sessionStr);
  const user = session?.user;
  const accessToken = session?.access_token;
  
  if (!user || !accessToken) throw new Error('로그인이 필요합니다.');

  console.log('💬 메시지 전송 중...', message.substring(0, 20));

  return fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      room_id: roomId,
      sender_id: user.id,
      message,
    }),
  })
    .then(response => {
      console.log('✅ 메시지 전송 응답:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('✅ 메시지 저장 완료:', data);
      return Array.isArray(data) ? data[0] : data;
    });
}

// 메시지 읽음 처리 (Fetch API)
export function markMessagesAsRead(roomId: string): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) return Promise.resolve();
  
  try {
    const session = JSON.parse(sessionStr);
    const user = session?.user;
    const accessToken = session?.access_token;
    
    if (!user || !accessToken) return Promise.resolve();

    // PostgREST PATCH 요청
    return fetch(`${supabaseUrl}/rest/v1/chat_messages?room_id=eq.${roomId}&sender_id=neq.${user.id}&is_read=eq.false`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_read: true }),
    })
      .then(() => console.log('✅ 메시지 읽음 처리 완료'))
      .catch(error => console.error('❌ 읽음 처리 실패:', error));
  } catch (error) {
    console.error('❌ 읽음 처리 초기화 실패:', error);
    return Promise.resolve();
  }
}

// 실시간 메시지 구독 (Broadcast + Postgres Changes 모두 사용)
export function subscribeToChatMessages(
  roomId: string,
  callback: (message: ChatMessage) => void
) {
  console.log('구독 설정 중:', roomId);
  
  const channel = supabase
    .channel(`chat_room:${roomId}`)
    // Broadcast 이벤트 수신 (즉시 전달)
    .on(
      'broadcast',
      { event: 'new_message' },
      (payload) => {
        console.log('Broadcast 메시지 수신:', payload);
        callback(payload.payload as ChatMessage);
      }
    )
    // Postgres Changes 이벤트 수신 (백업)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('Postgres 이벤트 수신:', payload);
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe((status) => {
      console.log('구독 상태:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ 채팅 구독 완료:', roomId);
      }
    });

  return channel;
}

// Broadcast로 메시지 전송
export async function broadcastMessage(roomId: string, message: ChatMessage) {
  const channel = supabase.channel(`chat_room:${roomId}`);
  
  await channel.send({
    type: 'broadcast',
    event: 'new_message',
    payload: message,
  });

  console.log('Broadcast 메시지 전송:', message);
}

// 전체 읽지 않은 메시지 개수 가져오기 (Fetch API)
export function getTotalUnreadCount(): Promise<number> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0];
  const key = `sb-${projectRef}-auth-token`;
  const sessionStr = localStorage.getItem(key);
  
  if (!sessionStr) return Promise.resolve(0);
  
  try {
    const session = JSON.parse(sessionStr);
    const user = session?.user;
    const accessToken = session?.access_token;
    
    if (!user || !accessToken) return Promise.resolve(0);

    // 1단계: 내 채팅방 ID 가져오기
    const buyerUrl = `${supabaseUrl}/rest/v1/chat_rooms?buyer_id=eq.${user.id}&select=id`;
    const sellerUrl = `${supabaseUrl}/rest/v1/chat_rooms?seller_id=eq.${user.id}&select=id`;

    return Promise.all([
      fetch(buyerUrl, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${accessToken}` },
      }).then(r => r.json()),
      fetch(sellerUrl, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${accessToken}` },
      }).then(r => r.json()),
    ])
      .then(([buyerRooms, sellerRooms]) => {
        const allRooms = [...buyerRooms, ...sellerRooms];
        const uniqueRoomIds = Array.from(new Set(allRooms.map(room => room.id)));
        
        if (uniqueRoomIds.length === 0) return 0;

        // 2단계: 각 채팅방의 읽지 않은 메시지 개수 세기
        const countPromises = uniqueRoomIds.map(roomId => {
          return fetch(`${supabaseUrl}/rest/v1/chat_messages?room_id=eq.${roomId}&sender_id=neq.${user.id}&is_read=eq.false&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
            },
          })
            .then(response => response.json())
            .then(data => Array.isArray(data) ? data.length : 0);
        });

        return Promise.all(countPromises).then(counts => {
          const total = counts.reduce((sum, count) => sum + count, 0);
          console.log('🔔 전체 읽지 않은 메시지:', total);
          return total;
        });
      })
      .catch(() => 0);
  } catch (error) {
    console.error('❌ getTotalUnreadCount 에러:', error);
    return Promise.resolve(0);
  }
}
