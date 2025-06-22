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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('to_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('subject', 150);
            $table->text('content');
            $table->enum('status', ['unread', 'read', 'responded'])->default('unread');
            $table->timestamps();
            
            // Indexes for better performance
            $table->index('user_id');
            $table->index('to_admin_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
