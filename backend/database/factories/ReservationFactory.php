<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Reservation>
 */
class ReservationFactory extends Factory
{
    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('+1 day', '+30 days');
        $end   = (clone $start)->modify('+2 hours');

        return [
            'user_id'          => User::factory(),
            'start_datetime'   => $start,
            'end_datetime'     => $end,
            'status'           => 'confirmed',
            'total_price'      => $this->faker->numberBetween(2000, 10000),
            'customer_name'    => null,
            'customer_phone'   => null,
            'reserved_by_admin' => false,
            'notes'            => null,
        ];
    }
}
