-- 채팅방에 판매확정 시각 추가 (판매자가 "판매확정" 버튼을 누른 채팅방만 구매자에게 리뷰 권한 부여)
ALTER TABLE public.chat_rooms
ADD COLUMN IF NOT EXISTS sale_confirmed_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.chat_rooms.sale_confirmed_at IS '판매자가 이 채팅 상대에게 판매확정한 시각. 이 채팅방의 buyer만 해당 상품 리뷰 작성 가능.';
