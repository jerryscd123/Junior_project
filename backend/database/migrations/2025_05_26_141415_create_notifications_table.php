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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['like', 'comment', 'admin_message', 'post_approved', 'post_rejected', 'comment_approved', 'comment_rejected']);
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            
            // Indexes for better performance
            $table->index('user_id');
            $table->index('is_read');
            $table->index(['user_id', 'is_read']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
