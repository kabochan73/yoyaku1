<x-mail::message>
# 予約が確定しました

以下の内容で予約を受け付けました。

**日時：** {{ $reservation->start_datetime->format('Y年n月j日 H:i') }} 〜 {{ $reservation->end_datetime->format('H:i') }}

当日は時間までにお越しください。

{{ config('app.name') }}
</x-mail::message>
