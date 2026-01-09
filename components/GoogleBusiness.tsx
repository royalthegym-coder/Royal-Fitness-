import React, { useState } from 'react';
import Card from './common/Card';
import { INITIAL_GOOGLE_REVIEWS, INITIAL_GOOGLE_POSTS } from '../constants';
import { GoogleReview, GoogleBusinessPost } from '../types';
import { StarIcon } from './icons/StarIcon';
import { getComplexResponse, getGoogleSearchResponse } from '../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import Modal from './common/Modal';

const GoogleBusiness: React.FC = () => {
    const [reviews, setReviews] = useState<GoogleReview[]>(INITIAL_GOOGLE_REVIEWS);
    const [posts, setPosts] = useState<GoogleBusinessPost[]>(INITIAL_GOOGLE_POSTS);
    const [replyingTo, setReplyingTo] = useState<GoogleReview | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNewPostModalOpen, setNewPostModalOpen] = useState(false);

    const handleGenerateReply = async (review: GoogleReview) => {
        setReplyingTo(review);
        setIsGenerating(true);
        const prompt = `Generate a professional and friendly reply to the following customer review for a gym named "Royal The Gym". Keep it concise.
        
        Reviewer: ${review.authorName}
        Rating: ${review.rating}/5
        Comment: "${review.comment}"
        `;
        const generatedReply = await getComplexResponse(prompt);
        setReplyText(generatedReply);
        setIsGenerating(false);
    };
    
    const handleSendReply = () => {
        if (!replyingTo) return;
        const updatedReviews = reviews.map(r => 
            r.id === replyingTo.id 
            ? { ...r, reply: { comment: replyText, timestamp: new Date().toISOString().split('T')[0] } } 
            : r
        );
        setReviews(updatedReviews);
        setReplyingTo(null);
        setReplyText('');
    };

    return (
        <div className="space-y-6">
            <Card title="Manage Google Reviews">
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{review.authorName}</p>
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-500'}`} />)}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">{review.timestamp}</span>
                            </div>
                            <p className="mt-2 text-gray-300">{review.comment}</p>
                            
                            {review.reply ? (
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <p className="font-semibold text-amber-400 text-sm">Your reply:</p>
                                    <p className="text-gray-300 text-sm">{review.reply.comment}</p>
                                </div>
                            ) : replyingTo?.id === review.id ? (
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <textarea 
                                        value={replyText} 
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-600"
                                        rows={3}
                                        disabled={isGenerating}
                                    />
                                    <div className="flex justify-end space-x-2 mt-2">
                                        <button onClick={() => setReplyingTo(null)} className="text-xs bg-gray-600 py-1 px-3 rounded">Cancel</button>
                                        <button onClick={handleSendReply} className="text-xs bg-blue-600 py-1 px-3 rounded">Send</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 flex justify-end">
                                    <button onClick={() => handleGenerateReply(review)} disabled={isGenerating && replyingTo?.id === review.id} className="text-sm bg-blue-600 text-white font-bold py-1 px-3 rounded-lg hover:bg-blue-500 flex items-center disabled:bg-gray-500">
                                        <SparkleIcon className="w-4 h-4 mr-1" />
                                        {isGenerating && replyingTo?.id === review.id ? 'Generating...' : 'Generate Reply'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="Manage Google Business Posts">
                 <button onClick={() => setNewPostModalOpen(true)} className="w-full mb-4 bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">
                    Create New Post
                </button>
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className="bg-gray-700/50 p-4 rounded-lg flex flex-col md:flex-row gap-4">
                           {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full md:w-32 h-32 object-cover rounded-md" />}
                           <div className="flex-1">
                                <p className="text-gray-300">{post.content}</p>
                                <p className="text-xs text-gray-400 mt-2">Posted on: {post.timestamp}</p>
                           </div>
                        </div>
                    ))}
                </div>
            </Card>
            
            {isNewPostModalOpen && 
                <NewPostModal 
                    isOpen={isNewPostModalOpen} 
                    onClose={() => setNewPostModalOpen(false)}
                    onSave={(newPost) => {
                        setPosts(prev => [{...newPost, id: `post${prev.length + 1}`}, ...prev]);
                        setNewPostModalOpen(false);
                    }}
                />
            }
        </div>
    );
};

interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (post: Omit<GoogleBusinessPost, 'id'>) => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateContent = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        const prompt = `Write a short, engaging Google Business post for a gym named "Royal The Gym" about the following topic: "${topic}". Include a call to action.`;
        const result = await getGoogleSearchResponse(prompt); // Using search for up-to-date info if needed
        setContent(result.text);
        setIsLoading(false);
    };

    const handleSubmit = () => {
        onSave({
            content,
            timestamp: new Date().toISOString().split('T')[0],
            state: 'LIVE',
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Google Business Post">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Post Topic</label>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., New year discount, 24/7 opening hours"
                            className="flex-1 mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500"
                        />
                        <button onClick={handleGenerateContent} disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-500 flex items-center">
                            <SparkleIcon className="w-4 h-4 mr-1" />
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Post Content</label>
                    <textarea 
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500"
                    />
                </div>
                 <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 mr-2">Cancel</button>
                    <button onClick={handleSubmit} disabled={!content.trim()} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 disabled:bg-gray-500">Post</button>
                </div>
            </div>
        </Modal>
    );
};

export default GoogleBusiness;
