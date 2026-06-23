<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\PricingRule>
 */
class PricingRuleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'           => $this->faker->word() . '料金',
            'day_type'       => $this->faker->randomElement(['weekday', 'weekend', 'holiday']),
            'start_time'     => '09:00',
            'end_time'       => '17:00',
            'price_per_hour' => $this->faker->numberBetween(1000, 5000),
            'is_active'      => true,
        ];
    }
}
