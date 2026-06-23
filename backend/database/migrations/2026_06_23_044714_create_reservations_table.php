<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->datetime('start_datetime');
            $table->datetime('end_datetime');
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('confirmed');
            $table->integer('total_price');
            $table->string('customer_name')->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->boolean('reserved_by_admin')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
