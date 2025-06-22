<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Faq;

class FaqSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'What is MindSpeak and how can it help me?',
                'answer' => 'MindSpeak is a supportive online community platform designed for individuals seeking mental health support and connection. Our platform provides a safe space where you can share your experiences, connect with others who understand your journey, and access valuable resources. Whether you\'re dealing with anxiety, depression, stress, or other mental health challenges, MindSpeak offers peer support, professional insights, and a judgment-free environment to help you on your path to wellness.'
            ],
            [
                'question' => 'Is my information kept private and secure?',
                'answer' => 'Yes, we take your privacy and security very seriously. All personal information is encrypted and stored securely. You have the option to post anonymously if you prefer to keep your identity private. We never share your personal information with third parties without your explicit consent. Our platform complies with all relevant privacy laws and regulations to ensure your data is protected.'
            ],
            [
                'question' => 'Can I post anonymously?',
                'answer' => 'Absolutely! We understand that privacy is important when discussing mental health topics. You can choose to post anonymously for any content you share on the platform. When posting anonymously, your username will appear as "Anonymous User" and your profile information will not be visible to other users. This allows you to share your experiences and seek support while maintaining your privacy.'
            ],
            [
                'question' => 'How are posts and comments moderated?',
                'answer' => 'All posts and comments go through a moderation process to ensure they meet our community guidelines. Our trained moderators review content to ensure it\'s supportive, appropriate, and safe for all users. Content that violates our guidelines, contains harmful advice, or is inappropriate will be rejected. We aim to maintain a positive, supportive environment where everyone feels safe to share and seek help.'
            ],
            [
                'question' => 'What should I do if I\'m having thoughts of self-harm?',
                'answer' => 'If you\'re having thoughts of self-harm or suicide, please reach out for immediate help. Contact your local emergency services (911 in the US), call the National Suicide Prevention Lifeline at 988, or go to your nearest emergency room. While MindSpeak provides peer support, we are not a substitute for professional mental health care or crisis intervention. Please prioritize your safety and seek immediate professional help.'
            ],
            [
                'question' => 'Can I get professional therapy through MindSpeak?',
                'answer' => 'MindSpeak is a peer support platform and does not provide professional therapy services directly. However, we do have mental health professionals who participate in our community and share educational content. We strongly encourage seeking professional help from licensed therapists, counselors, or psychiatrists for clinical treatment. Our platform can complement professional care by providing ongoing peer support and community connection.'
            ],
            [
                'question' => 'How do I report inappropriate content or behavior?',
                'answer' => 'If you encounter content or behavior that violates our community guidelines, please report it immediately. You can use the report function available on each post and comment, or contact our moderation team directly through the contact form. We take all reports seriously and will investigate promptly. Our goal is to maintain a safe, supportive environment for all users.'
            ],
            [
                'question' => 'What types of mental health topics can I discuss?',
                'answer' => 'You can discuss a wide range of mental health topics including anxiety, depression, stress management, coping strategies, therapy experiences, medication questions, relationship issues, work-life balance, grief, trauma recovery, and general wellness. We encourage open, honest discussions that can help others feel less alone in their struggles. However, please avoid sharing specific medical advice or encouraging harmful behaviors.'
            ],
            [
                'question' => 'How do I connect with others who have similar experiences?',
                'answer' => 'You can connect with others through our tagging system, which helps categorize posts by topic. Browse posts with tags that relate to your experiences, such as #anxiety, #depression, or #recovery. You can also comment on posts that resonate with you and engage in supportive conversations. Our community is built on mutual support and understanding, so don\'t hesitate to reach out and connect with others.'
            ],
            [
                'question' => 'Is there a mobile app available?',
                'answer' => 'Currently, MindSpeak is available as a web-based platform that works on all devices including smartphones, tablets, and computers. We\'re working on developing a dedicated mobile app to make it even easier to access our community on the go. In the meantime, you can access MindSpeak through your mobile browser for a mobile-optimized experience.'
            ],
            [
                'question' => 'How do I delete my account if I no longer want to use the platform?',
                'answer' => 'If you decide you no longer want to use MindSpeak, you can delete your account by going to your account settings and selecting the "Delete Account" option. Please note that this action is permanent and cannot be undone. All your posts and comments will be removed from the platform. If you have any concerns or need assistance, please contact our support team before deleting your account.'
            ],
            [
                'question' => 'What are the community guidelines I should follow?',
                'answer' => 'Our community guidelines are designed to create a safe, supportive environment for everyone. Key guidelines include: be respectful and kind to all users, avoid sharing personal medical advice, respect others\' privacy and anonymity choices, no harassment or bullying, avoid triggering content without appropriate warnings, and focus on support rather than debate. Detailed community guidelines are available in your account settings.'
            ]
        ];

        foreach ($faqs as $faqData) {
            Faq::create($faqData);
        }
    }
} 