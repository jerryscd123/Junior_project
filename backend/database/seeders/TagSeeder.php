<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;

class TagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            'anxiety',
            'depression',
            'mental health',
            'therapy',
            'counseling',
            'mindfulness',
            'meditation',
            'self care',
            'stress management',
            'coping strategies',
            'support',
            'recovery',
            'wellness',
            'healing',
            'personal growth',
            'relationships',
            'family',
            'work stress',
            'burnout',
            'trauma',
            'ptsd',
            'bipolar',
            'adhd',
            'eating disorders',
            'addiction',
            'grief',
            'loss',
            'hope',
            'motivation',
            'inspiration',
            'community',
            'peer support',
            'professional help',
            'medication',
            'exercise',
            'sleep',
            'nutrition',
            'breathing exercises',
            'journaling',
            'art therapy',
            'music therapy',
            'group therapy',
            'individual therapy',
            'cognitive behavioral therapy',
            'dialectical behavior therapy',
            'acceptance',
            'forgiveness',
            'boundaries',
            'communication',
            'emotional regulation'
        ];

        foreach ($tags as $tagName) {
            Tag::create([
                'name' => $tagName,
            ]);
        }
    }
} 