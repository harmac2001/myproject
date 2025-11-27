import React, { useState, useEffect, useRef } from 'react'
import { Save, Ban, Edit2, Trash2, Plus, Bold, Italic, List } from 'lucide-react'

export default function CommentsTab({ incidentId }) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [comments, setComments] = useState([])
    const [originalComments, setOriginalComments] = useState([])

    useEffect(() => {
        if (incidentId && incidentId !== 'new') {
            fetchComments()
        }
    }, [incidentId])

    const fetchComments = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:5000/api/comments/${incidentId}`)
            const data = await response.json()
            setComments(data)
            setOriginalComments(JSON.parse(JSON.stringify(data))) // Deep copy
        } catch (err) {
            console.error('Error fetching comments:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteComment = (commentId) => {
        setComments(comments.filter(c => c.id !== commentId))
    }

    const handleCommentChange = (commentId, field, value) => {
        setComments(comments.map(c =>
            c.id === commentId ? { ...c, [field]: value } : c
        ))
    }

    const handleFormat = (commentId, command) => {
        const editorElement = document.getElementById(`editor_${commentId}`)
        if (editorElement) {
            editorElement.focus()
            document.execCommand(command, false, null)
        }
    }

    const handleSave = async () => {
        if (incidentId === 'new') {
            alert('Please save the incident before adding comments.')
            return
        }

        // Validation: Check if all comments have subject and text
        const invalidComments = comments.filter(c => !c.subject || !c.comment_text || c.comment_text.trim() === '' || c.comment_text === '<br>')

        if (invalidComments.length > 0) {
            alert('All comments must have a Subject and Comment text.')
            return
        }

        setSaving(true)
        try {
            // Process all comments
            for (const comment of comments) {
                if (comment.isNew) {
                    // Create new comment
                    await fetch('http://localhost:5000/api/comments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            incident_id: incidentId,
                            subject: comment.subject,
                            comment_text: comment.comment_text
                        })
                    })
                } else {
                    // Update existing comment
                    await fetch(`http://localhost:5000/api/comments/${comment.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subject: comment.subject,
                            comment_text: comment.comment_text
                        })
                    })
                }
            }

            // Delete comments that were removed
            const deletedComments = originalComments.filter(
                oc => !comments.find(c => c.id === oc.id)
            )
            for (const comment of deletedComments) {
                if (!comment.isNew) {
                    await fetch(`http://localhost:5000/api/comments/${comment.id}`, {
                        method: 'DELETE'
                    })
                }
            }

            // Refresh comments and exit edit mode
            await fetchComments()
            setIsEditing(false)
        } catch (err) {
            console.error('Error saving comments:', err)
            alert('Error saving comments: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setComments(JSON.parse(JSON.stringify(originalComments)))
        setIsEditing(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="border border-slate-200 rounded-b-md p-4 bg-white">
            <div className="space-y-4">
                {/* New Comment Form (always visible in edit mode) */}
                {isEditing && (
                    <div className="border border-slate-200 rounded-md p-4 bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">New Comment</h3>
                        <div className="space-y-3">
                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                    value={comments.find(c => c.isNew)?.subject || ''}
                                    onChange={(e) => {
                                        const newComment = comments.find(c => c.isNew)
                                        if (newComment) {
                                            handleCommentChange(newComment.id, 'subject', e.target.value)
                                        } else {
                                            // Create new comment if it doesn't exist
                                            const tempComment = {
                                                id: `new_${Date.now()}`,
                                                subject: e.target.value,
                                                comment_text: '',
                                                isNew: true
                                            }
                                            setComments([tempComment, ...comments])
                                        }
                                    }}
                                    placeholder="Enter subject..."
                                />
                            </div>

                            {/* Comment Text */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Comment <span className="text-red-500">*</span></label>
                                <div className="border border-slate-300 rounded-md overflow-hidden">
                                    {/* Toolbar */}
                                    <div className="bg-slate-100 border-b border-slate-300 p-2 flex gap-2">
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                const newComment = comments.find(c => c.isNew)
                                                if (newComment) {
                                                    handleFormat(newComment.id, 'bold')
                                                }
                                            }}
                                            className="p-1 hover:bg-slate-200 rounded"
                                            title="Bold"
                                        >
                                            <Bold className="h-4 w-4 text-slate-600" />
                                        </button>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                const newComment = comments.find(c => c.isNew)
                                                if (newComment) {
                                                    handleFormat(newComment.id, 'italic')
                                                }
                                            }}
                                            className="p-1 hover:bg-slate-200 rounded"
                                            title="Italic"
                                        >
                                            <Italic className="h-4 w-4 text-slate-600" />
                                        </button>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                const newComment = comments.find(c => c.isNew)
                                                if (newComment) {
                                                    handleFormat(newComment.id, 'insertUnorderedList')
                                                }
                                            }}
                                            className="p-1 hover:bg-slate-200 rounded"
                                            title="Bullet List"
                                        >
                                            <List className="h-4 w-4 text-slate-600" />
                                        </button>
                                    </div>

                                    {/* Editor Area */}
                                    <div
                                        id={`editor_${comments.find(c => c.isNew)?.id || 'new'}`}
                                        contentEditable
                                        dir="ltr"
                                        className="min-h-[100px] p-3 text-sm focus:outline-none"
                                        style={{ listStylePosition: 'inside' }}
                                        onInput={(e) => {
                                            const newComment = comments.find(c => c.isNew)
                                            if (newComment) {
                                                handleCommentChange(newComment.id, 'comment_text', e.currentTarget.innerHTML)
                                            } else {
                                                // Create new comment if it doesn't exist
                                                const tempComment = {
                                                    id: `new_${Date.now()}`,
                                                    subject: '',
                                                    comment_text: e.currentTarget.innerHTML,
                                                    isNew: true
                                                }
                                                setComments([tempComment, ...comments])
                                            }
                                        }}
                                        suppressContentEditableWarning
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Existing Comments List */}
                {comments.filter(c => !c.isNew).length === 0 && !isEditing ? (
                    <div className="text-center text-slate-500 py-8">
                        No comments yet
                    </div>
                ) : (
                    comments.filter(c => !c.isNew).map((comment) => (
                        <div key={comment.id} className="border border-slate-200 rounded-md p-4 bg-slate-50">
                            <div className="space-y-3">
                                {/* Subject */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm disabled:bg-white disabled:text-slate-900 disabled:border-slate-300"
                                        value={comment.subject}
                                        onChange={(e) => handleCommentChange(comment.id, 'subject', e.target.value)}
                                        disabled={!isEditing}
                                    />
                                </div>

                                {/* Comment Text */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Comment <span className="text-red-500">*</span></label>
                                    <div className="border border-slate-300 rounded-md overflow-hidden">
                                        {/* Toolbar (only in edit mode) */}
                                        {isEditing && (
                                            <div className="bg-slate-100 border-b border-slate-300 p-2 flex gap-2">
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleFormat(comment.id, 'bold')}
                                                    className="p-1 hover:bg-slate-200 rounded"
                                                    title="Bold"
                                                >
                                                    <Bold className="h-4 w-4 text-slate-600" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleFormat(comment.id, 'italic')}
                                                    className="p-1 hover:bg-slate-200 rounded"
                                                    title="Italic"
                                                >
                                                    <Italic className="h-4 w-4 text-slate-600" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleFormat(comment.id, 'insertUnorderedList')}
                                                    className="p-1 hover:bg-slate-200 rounded"
                                                    title="Bullet List"
                                                >
                                                    <List className="h-4 w-4 text-slate-600" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Editor/Display Area */}
                                        <div
                                            id={`editor_${comment.id}`}
                                            contentEditable={isEditing}
                                            dir="ltr"
                                            className={`min-h-[100px] p-3 text-sm focus:outline-none ${isEditing ? '' : 'bg-white'
                                                }`}
                                            style={{
                                                listStylePosition: 'inside'
                                            }}
                                            onInput={(e) => handleCommentChange(comment.id, 'comment_text', e.currentTarget.innerHTML)}
                                            suppressContentEditableWarning
                                        >
                                            {comment.comment_text && (
                                                <span dangerouslySetInnerHTML={{ __html: comment.comment_text }} />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button (only in edit mode) */}
                                {isEditing && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                        >
                                            <Trash2 className="h-4 w-4" /> Delete Comment
                                        </button>
                                    </div>
                                )}

                                {/* Metadata (only for existing comments, not in edit mode) */}
                                {!isEditing && !comment.isNew && (
                                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                                        Created: {new Date(comment.created_date * 1000).toLocaleString()}
                                        {comment.last_modified_date && comment.last_modified_date !== comment.created_date && (
                                            <> • Modified: {new Date(comment.last_modified_date * 1000).toLocaleString()}</>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-2">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleSave}
                            disabled={saving || incidentId === 'new'}
                            className="bg-[#56a7e9] text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-[#4a96d3] flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-[#fbbf24] text-slate-900 px-8 py-2 rounded-md text-sm font-medium hover:bg-[#f59e0b] flex items-center gap-2"
                        >
                            <Ban className="h-4 w-4" /> Cancel
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        disabled={incidentId === 'new'}
                        className="bg-[#0078d4] text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-[#006cbd] flex items-center gap-2 disabled:opacity-50"
                    >
                        <Edit2 className="h-4 w-4" /> Edit
                    </button>
                )}
            </div>

            {/* CSS for bullet lists */}
            <style jsx>{`
                [contenteditable] ul {
                    list-style-type: disc;
                    padding-left: 20px;
                    margin: 10px 0;
                }
                [contenteditable] ol {
                    list-style-type: decimal;
                    padding-left: 20px;
                    margin: 10px 0;
                }
                [contenteditable] li {
                    margin: 5px 0;
                }
                /* Also apply to non-editable mode */
                div[contenteditable="false"] ul {
                    list-style-type: disc;
                    padding-left: 20px;
                    margin: 10px 0;
                }
                div[contenteditable="false"] ol {
                    list-style-type: decimal;
                    padding-left: 20px;
                    margin: 10px 0;
                }
                div[contenteditable="false"] li {
                    margin: 5px 0;
                }
            `}</style>
        </div>
    )
}
