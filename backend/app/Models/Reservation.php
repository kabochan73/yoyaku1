<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'user_id',
        'start_datetime',
        'end_datetime',
        'status',
        'total_price',
        'customer_name',
        'customer_phone',
        'reserved_by_admin',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_datetime' => 'datetime',
            'end_datetime' => 'datetime',
            'reserved_by_admin' => 'boolean',
            'total_price' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
