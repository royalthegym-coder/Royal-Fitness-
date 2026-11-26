import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Send, Flame } from 'lucide-react';
import { useData } from '../context/DataProvider';

const FutureFeed: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
    const { communityPosts, addCommunityPost, likeCommunityPost, commentCommunityPost } = useData();
    const [newPostContent, setNewPostContent] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePostSubmit = () => {
        if (!newPostContent.trim() && !imagePreview) return;

        addCommunityPost({
            id: Date.now().toString(),
            memberId: currentUser?.id || 0,
            memberName: currentUser?.name || 'Admin',
            memberAvatar: currentUser?.avatar,
            content: newPostContent,
            imageUrl: imagePreview || undefined,
            likes: 0,
            comments: [],
            timestamp: new Date().toISOString()
        });

        setNewPostContent('');
        setImagePreview(null);
    };

    const handleCommentSubmit = (postId: string) => {
        if (!commentText.trim()) return;
        commentCommunityPost(postId, {
            memberName: currentUser?.name || 'Admin',
            text: commentText
        });
        setCommentText('');
        setActiveCommentPost(null);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Future <span className="text-fuchsia-400">Feed</span>
                    </h2>
                    <p className="text-fuchsia-500/60 font-mono text-xs uppercase tracking-[0.2em] mt-1">Community & PRs</p>
                </div>
                <Flame className="w-8 h-8 text-fuchsia-400 animate-pulse" />
            </div>

            {/* Create Post */}
            <div className="bg-black/40 border border-fuchsia-500/30 rounded-2xl p-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-fuchsia-900/50 border border-fuchsia-500/30 flex items-center justify-center overflow-hidden shrink-0">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.name || "User Avatar"} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                        ) : (
                            <span className="text-fuchsia-400 font-bold text-xs">{currentUser?.name?.charAt(0) || 'A'}</span>
                        )}
                    </div>
                    <div className="flex-1 space-y-4">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Share your PR, workout selfie, or fitness thoughts..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 resize-none min-h-[100px]"
                        />
                        
                        {imagePreview && (
                            <div className="relative rounded-xl overflow-hidden border border-white/10">
                                <img src={imagePreview} alt="Post attachment" className="w-full max-h-96 object-cover rounded-2xl border border-white/5" />
                                <button 
                                    onClick={() => setImagePreview(null)}
                                    className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-red-500/50"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-gray-400 hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                            >
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Add Photo</span>
                            </button>
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleImageUpload} 
                            />
                            <button 
                                onClick={handlePostSubmit}
                                disabled={!newPostContent.trim() && !imagePreview}
                                className="bg-fuchsia-600 text-white px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-fuchsia-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" /> Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-6">
                {communityPosts.map((post) => (
                    <motion.div 
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden"
                    >
                        {/* Post Header */}
                        <div className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden">
                                {post.memberAvatar ? (
                                    <img src={post.memberAvatar} alt={post.memberName} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 font-bold text-xs">{post.memberName.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">{post.memberName}</h4>
                                <p className="text-gray-500 text-xs">{new Date(post.timestamp).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="px-4 pb-4">
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{post.content}</p>
                        </div>

                        {/* Post Image */}
                        {post.imageUrl && (
                            <div className="w-full border-y border-white/5">
                                <img src={post.imageUrl} alt="Post content" className="w-full max-h-96 object-cover" />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-4 flex items-center gap-6 border-b border-white/5">
                            <button 
                                onClick={() => likeCommunityPost(post.id)}
                                className="flex items-center gap-2 text-gray-400 hover:text-fuchsia-400 transition-colors"
                            >
                                <Heart className="w-5 h-5" />
                                <span className="text-xs font-bold">{post.likes}</span>
                            </button>
                            <button 
                                onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-xs font-bold">{post.comments.length}</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors ml-auto">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Comments Section */}
                        {activeCommentPost === post.id && (
                            <div className="p-4 bg-white/5 space-y-4">
                                {post.comments.map((comment, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                            <span className="text-white text-[10px] font-bold">{comment.memberName.charAt(0)}</span>
                                        </div>
                                        <div className="bg-black/50 rounded-xl p-3 flex-1">
                                            <p className="text-xs font-bold text-gray-300 mb-1">{comment.memberName}</p>
                                            <p className="text-xs text-gray-400">{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-4">
                                    <input 
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                                    />
                                    <button 
                                        onClick={() => handleCommentSubmit(post.id)}
                                        disabled={!commentText.trim()}
                                        className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
                
                {communityPosts.length === 0 && (
                    <div className="text-center py-20 bg-black/20 rounded-2xl border border-white/5">
                        <Flame className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No posts yet. Be the first to share your PR!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FutureFeed;
