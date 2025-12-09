import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Loader, Folder, Image, File } from 'lucide-react';

const DocumentsTab = ({ incidentId }) => {
    const [files, setFiles] = useState([]);
    const [folderUrl, setFolderUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (incidentId) {
            fetchDocuments();
        }
    }, [incidentId]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/incidents/${incidentId}/documents`);
            if (!response.ok) {
                if (response.status === 404) {
                    setFiles([]);
                    return;
                }
                throw new Error('Failed to fetch documents');
            }
            const data = await response.json();

            // Handle new structure { files: [], folderUrl: '...' }
            if (data.folderUrl) {
                setFolderUrl(data.folderUrl);
            }

            if (data.files) {
                setFiles(data.files);
            } else if (Array.isArray(data)) {
                // Fallback for old API style if cached?
                setFiles(data);
            } else {
                setFiles([]);
            }
        } catch (err) {
            console.error('Error loading documents:', err);
            setError('Could not load documents from SharePoint.');
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <Image className="h-5 w-5 text-blue-500" />;
        if (['pdf'].includes(ext)) return <FileText className="h-5 w-5 text-red-500" />;
        if (['doc', 'docx'].includes(ext)) return <FileText className="h-5 w-5 text-blue-700" />;
        if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileText className="h-5 w-5 text-green-600" />;
        return <File className="h-5 w-5 text-gray-500" />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Folder className="h-5 w-5 text-[#0078d4]" />
                    {folderUrl ? (
                        <a
                            href={folderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline"
                            title="Open Folder in SharePoint"
                        >
                            SharePoint Documents
                        </a>
                    ) : (
                        'SharePoint Documents'
                    )}
                </h3>
                <button
                    onClick={fetchDocuments}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : error ? (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
                    {error}
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <p>No documents found in the folder.</p>
                    <p className="text-xs mt-1">(Folder: {`20XX/Ref - Vessel`})</p>
                </div>
            ) : (
                <div className="overflow-hidden border border-slate-200 rounded-md">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Modified</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {files.map((file) => (
                                <tr key={file.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={file.webUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 group"
                                        >
                                            {getFileIcon(file.name)}
                                            <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 group-hover:underline">{file.name}</span>
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(file.lastModifiedDateTime).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {formatSize(file.size)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;
