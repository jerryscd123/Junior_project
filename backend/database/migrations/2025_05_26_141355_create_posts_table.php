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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('is_anonymous')->default(false);
            $table->string('title', 200);
            $table->text('content');
            $table->string('image')->nullable();
            $table->json('image_metadata')->nullable();
            $table->string('emotion')->nullable();
            $table->string('link')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->integer('like_count')->default(0);
            $table->integer('comment_count')->default(0);
            $table->timestamps();
            
            // Indexes for better performance
            $table->index('status');
            $table->index('created_at');
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
