<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReservationConfirmed extends Mailable
{
    use SerializesModels;

    public function __construct(public Reservation $reservation) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '予約確定のお知らせ');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.reservation-confirmed');
    }

    public function attachments(): array
    {
        return [];
    }
}
