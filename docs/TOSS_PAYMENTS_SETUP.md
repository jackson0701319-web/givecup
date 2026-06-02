# 토스페이먼츠 연동 가이드 (GiveCup)

## 1. 토스페이먼츠 가맹점 등록

1. [토스페이먼츠](https://www.tosspayments.com/) 접속 → **이용 신청**
2. 사업자/개인 정보 제출 후 심사 (테스트는 아래 **문서용 테스트 키**로 바로 개발 가능)
3. 승인 후 [개발자센터](https://developers.tosspayments.com/) 로그인
4. **API 키** 메뉴에서 확인:
   - **결제위젯 연동 키** 또는 **API 개별 연동 키**의 **클라이언트 키** (`test_gck_...` / `live_gck_...`)
   - **시크릿 키** (`test_gsk_...` / `live_gsk_...`) — **서버 전용, Git에 올리지 마세요**

## 2. Supabase 테이블

SQL Editor에서 실행:

- **`groups.id`가 숫자(bigint)** 인 경우 → `supabase/payment_orders.sql` (GiveCup 기본 Supabase)
- **`groups.id`가 uuid** 인 경우 → `supabase/payment_orders-uuid.sql`

`foreign key ... incompatible types: uuid and bigint` 오류가 나면 bigint용 파일을 쓰세요.

## 3. 환경 변수

로컬 `.env.local` 및 Vercel **Project** Environment Variables:

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 클라이언트 키 (브라우저) |
| `TOSS_SECRET_KEY` | 시크릿 키 (서버만) |
| `NEXT_PUBLIC_USD_KRW_RATE` | (선택) USD→KRW 환율, 기본 1400 |
| `USD_KRW_RATE` | (선택) 서버 환율, 기본 1400 |
| `ALLOW_MOCK_DONATIONS` | `true`면 키가 있어도 결제 없이 기부 API 허용 (로컬 테스트용) |

**테스트 키 (문서 예시, 공개용):** 개발자센터 문서의 `test_gck_docs_...` 등을 사용할 수 있습니다.

키를 넣고 **Redeploy**해야 프로덕션에 반영됩니다.

## 4. 결제 흐름

1. 사용자가 **토스페이로 결제하기** 클릭
2. `POST /api/payments/orders` → 주문 생성 (pending)
3. 토스 결제창 → 카드/간편결제
4. 성공 시 `/payment/success?paymentKey&orderId&amount` 로 이동
5. `POST /api/payments/confirm` → 토스 승인 + 랭킹/장부 반영
6. 인증서·영수증 화면 표시

키가 **없으면** 기존처럼 결제 없이 `/api/donations`만 호출됩니다 (프로토타입 모드).

## 5. 운영 체크리스트

- [ ] 라이브 키로 전환 (`live_gck_`, `live_gsk_`)
- [ ] 토스 개발자센터에 **성공/실패 URL** 등록: `https://givecup.vercel.app/payment/success`, `/payment/fail`
- [ ] `ALLOW_MOCK_DONATIONS` 프로덕션에서는 **설정하지 않기**
- [ ] 시크릿 키는 Vercel에만 저장

## 참고

- [토스페이먼츠 연동 문서](https://docs.tosspayments.com/)
- 문의: 토스페이먼츠 고객센터 / 개발자센터 FAQ
