import React, { useState } from 'react';
import { X, ChevronRight, Settings, Users, Anchor, Briefcase, MapPin, FileText, UserPlus, Building, Truck, Shield } from 'lucide-react';
import EditVesselModal from './EditVesselModal';
import EditMemberModal from './EditMemberModal';
import EditAgentModal from './EditAgentModal';
import EditOfficeModal from './EditOfficeModal';
import EditClubModal from './EditClubModal';
import EditClaimHandlerModal from './EditClaimHandlerModal';
import EditServiceProviderModal from './EditServiceProviderModal';
import GenericOptionModal from './GenericOptionModal';
import ReassignVesselModal from './ReassignVesselModal';
import ReassignMemberModal from './ReassignMemberModal';
import ReassignAgentModal from './ReassignAgentModal';
import ReassignClaimHandlerModal from './ReassignClaimHandlerModal';
import DeleteWarningModal from './DeleteWarningModal';

const ManagementSidebar = ({ isOpen, onClose }) => {
    const [activeCategory, setActiveCategory] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals state
    const [showVesselModal, setShowVesselModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showOfficeModal, setShowOfficeModal] = useState(false);
    const [showClubModal, setShowClubModal] = useState(false);
    const [showClaimHandlerModal, setShowClaimHandlerModal] = useState(false);
    const [showServiceProviderModal, setShowServiceProviderModal] = useState(false);
    const [showGenericModal, setShowGenericModal] = useState(false);

    // Deletion / Reassign Modals
    const [showReassignVesselModal, setShowReassignVesselModal] = useState(false);
    const [showReassignMemberModal, setShowReassignMemberModal] = useState(false);
    const [showReassignAgentModal, setShowReassignAgentModal] = useState(false);
    const [showReassignClaimHandlerModal, setShowReassignClaimHandlerModal] = useState(false);
    const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
    const [deleteWarningMessage, setDeleteWarningMessage] = useState('');
    const [reassignId, setReassignId] = useState(null);

    const [editingId, setEditingId] = useState(null);

    const categories = [
        { id: 'ships', label: 'Vessels', icon: Anchor, type: 'custom', endpoint: 'ships' },
        { id: 'members', label: 'Members / Managers', icon: Users, type: 'custom', endpoint: 'members' },
        { id: 'agents', label: 'Local Agents', icon: UserPlus, type: 'custom', endpoint: 'agents' },
        { id: 'traders', label: 'Traders', icon: Truck, type: 'generic', endpoint: 'traders' },
        { id: 'service_providers', label: 'Service Providers', icon: Briefcase, type: 'custom', endpoint: 'service_providers' },
        { id: 'contractors', label: 'Contractors', icon: Briefcase, type: 'generic', endpoint: 'contractors' },
        { id: 'offices', label: 'Handling Offices', icon: Building, type: 'custom', endpoint: 'offices' },
        { id: 'ports', label: 'Ports (Places)', icon: MapPin, type: 'generic', endpoint: 'ports' },
        { id: 'clubs', label: 'Clients (Clubs)', icon: Shield, type: 'custom', endpoint: 'clubs' },
        { id: 'incident_types', label: 'Incident Types', icon: FileText, type: 'generic', endpoint: 'incident_types' },
        { id: 'reporters', label: 'Reporters', icon: Users, type: 'generic', endpoint: 'reporters' },
        { id: 'claim_handlers', label: 'Claim Handlers', icon: Users, type: 'custom', endpoint: 'claim_handlers' },
    ];

    const fetchItems = async (endpoint) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/options/${endpoint}`);
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error('Error fetching items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        fetchItems(category.endpoint);

        // Always show the generic list view first, even for custom types
        setShowGenericModal(true);
    };

    const handleGenericSave = async ({ name, id }) => {
        const endpoint = activeCategory.endpoint;
        const method = id ? 'PUT' : 'POST';
        const url = `http://localhost:5000/api/options/${endpoint}${id ? `/${id}` : ''}`;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err);
        }

        await fetchItems(endpoint);
    };

    const handleGenericDelete = async (id) => {
        const endpoint = activeCategory.endpoint;
        const res = await fetch(`http://localhost:5000/api/options/${endpoint}/${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            if (res.status === 400) { // Usage error or generic bad request
                try {
                    const errorData = await res.json();
                    // Check if it's a reassignable type (currently only ships fully implemented with reassign logic)
                    if (activeCategory.id === 'ships') {
                        setReassignId(id);
                        setShowReassignVesselModal(true);
                        return;
                    }
                    if (activeCategory.id === 'members') {
                        setReassignId(id);
                        setShowReassignMemberModal(true);
                        return;
                    }
                    if (activeCategory.id === 'agents') {
                        setReassignId(id);
                        setShowReassignAgentModal(true);
                        return;
                    }
                    if (activeCategory.id === 'claim_handlers') {
                        setReassignId(id);
                        setShowReassignClaimHandlerModal(true);
                        return;
                    }

                    // Default: Show warning modal with the backend message
                    setDeleteWarningMessage(errorData.message || 'Cannot delete item due to dependencies.');
                    setShowDeleteWarningModal(true);
                } catch (e) {
                    const err = await res.text();
                    alert(`Error deleting item: ${err}`);
                }
            } else {
                const err = await res.text();
                alert(`Error deleting item: ${err}`);
            }
            return;
        }

        await fetchItems(endpoint);
    };

    // Close all modals
    const closeModals = () => {
        setShowVesselModal(false);
        setShowMemberModal(false);
        setShowAgentModal(false);
        setShowOfficeModal(false);
        setShowClubModal(false);
        setShowClaimHandlerModal(false);
        setShowServiceProviderModal(false);
        setShowGenericModal(false);
        setShowReassignVesselModal(false);
        setShowReassignMemberModal(false);
        setShowReassignAgentModal(false);
        setShowReassignClaimHandlerModal(false);
        setShowDeleteWarningModal(false);
        setEditingId(null);
        setReassignId(null);
        setActiveCategory(null);
    };

    // Custom handlers
    const handleAddCustom = () => {
        setEditingId(null);
        if (activeCategory.id === 'ships') setShowVesselModal(true);
        if (activeCategory.id === 'members') setShowMemberModal(true);
        if (activeCategory.id === 'agents') setShowAgentModal(true);
        if (activeCategory.id === 'offices') setShowOfficeModal(true);
        if (activeCategory.id === 'clubs') setShowClubModal(true);
        if (activeCategory.id === 'claim_handlers') setShowClaimHandlerModal(true);
        if (activeCategory.id === 'service_providers') setShowServiceProviderModal(true);
    };

    const handleEditCustom = (item) => {
        setEditingId(item.id);
        if (activeCategory.id === 'ships') setShowVesselModal(true);
        if (activeCategory.id === 'members') setShowMemberModal(true);
        if (activeCategory.id === 'agents') setShowAgentModal(true);
        if (activeCategory.id === 'offices') setShowOfficeModal(true);
        if (activeCategory.id === 'clubs') setShowClubModal(true);
        if (activeCategory.id === 'claim_handlers') setShowClaimHandlerModal(true);
        if (activeCategory.id === 'service_providers') setShowServiceProviderModal(true);
    };

    // Callback when custom modal saves
    const handleCustomSaved = async () => {
        await fetchItems(activeCategory.endpoint);
        setShowVesselModal(false);
        setShowMemberModal(false);
        setShowAgentModal(false);
        setShowOfficeModal(false);
        setShowClubModal(false);
        setShowClaimHandlerModal(false);
        setShowServiceProviderModal(false);
        // Do NOT close the generic modal (list view) - keeping it open allows user to continue editing more items
    };

    return (
        <>
            {/* Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-transparent z-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform z-50 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#000080] text-white">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <h2 className="font-semibold text-lg">Manage Lists</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="py-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group border-b border-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-slate-700">
                                <cat.icon className="h-5 w-5 text-slate-400 group-hover:text-[#0078d4]" />
                                <span className="font-medium">{cat.label}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Generic Modal acting as List View for ALL types */}
            {activeCategory && (
                <GenericOptionModal
                    isOpen={showGenericModal}
                    onClose={closeModals}
                    title={activeCategory.label}
                    items={items}
                    onSave={activeCategory.type === 'generic' ? handleGenericSave : undefined}
                    onDelete={handleGenericDelete}
                    onAddCustom={activeCategory.type === 'custom' ? handleAddCustom : undefined}
                    onEditCustom={activeCategory.type === 'custom' ? handleEditCustom : undefined}
                />
            )}

            {/* Custom Edit Modals */}
            {showVesselModal && (
                <EditVesselModal
                    isOpen={showVesselModal}
                    onClose={() => setShowVesselModal(false)}
                    vesselId={editingId}
                    onSaved={handleCustomSaved}
                />
            )}

            {showMemberModal && (
                <EditMemberModal
                    isOpen={showMemberModal}
                    onClose={() => setShowMemberModal(false)}
                    memberId={editingId}
                    onSaved={handleCustomSaved}
                />
            )}

            {showAgentModal && (
                <EditAgentModal
                    isOpen={showAgentModal}
                    onClose={() => setShowAgentModal(false)}
                    agentId={editingId}
                    onSaved={handleCustomSaved}
                />
            )}

            {showOfficeModal && (
                <EditOfficeModal
                    isOpen={showOfficeModal}
                    onClose={() => setShowOfficeModal(false)}
                    officeId={editingId}
                    onSaved={handleCustomSaved}
                />
            )}

            {showClubModal && (
                <EditClubModal
                    isOpen={showClubModal}
                    onClose={() => setShowClubModal(false)}
                    clubId={editingId}
                    onSaved={handleCustomSaved}
                />
            )}

            {showClaimHandlerModal && (
                <EditClaimHandlerModal
                    isOpen={showClaimHandlerModal}
                    onClose={() => setShowClaimHandlerModal(false)}
                    handlerId={editingId}
                    onSaved={handleCustomSaved}
                />
            )}

            {showServiceProviderModal && (
                <EditServiceProviderModal
                    isOpen={showServiceProviderModal}
                    onClose={() => setShowServiceProviderModal(false)}
                    providerId={editingId}
                    onSaved={handleCustomSaved}
                />
            )}

            {/* Reassign Modal for Vessels */}
            {showReassignVesselModal && (
                <ReassignVesselModal
                    isOpen={showReassignVesselModal}
                    onClose={() => setShowReassignVesselModal(false)}
                    vesselId={reassignId}
                    vesselName={items.find(i => i.id === reassignId)?.name || 'Unknown'}
                    ships={items}
                    onReassignAndDelete={handleGenericDelete}
                    onReassigned={() => {/* Optional callback if needed, handled by onReassignAndDelete */ }}
                />
            )}

            {/* Reassign Modal for Members */}
            {showReassignMemberModal && (
                <ReassignMemberModal
                    isOpen={showReassignMemberModal}
                    onClose={() => setShowReassignMemberModal(false)}
                    memberId={reassignId}
                    memberName={items.find(i => i.id === reassignId)?.name || 'Unknown'}
                    members={items}
                    onReassignAndDelete={handleGenericDelete}
                />
            )}

            {/* Reassign Modal for Agents */}
            {showReassignAgentModal && (
                <ReassignAgentModal
                    isOpen={showReassignAgentModal}
                    onClose={() => setShowReassignAgentModal(false)}
                    agentId={reassignId}
                    agentName={items.find(i => i.id === reassignId)?.name || 'Unknown'}
                    agents={items}
                    onReassignAndDelete={handleGenericDelete}
                />
            )}

            {/* Reassign Modal for Claim Handlers */}
            {showReassignClaimHandlerModal && (
                <ReassignClaimHandlerModal
                    isOpen={showReassignClaimHandlerModal}
                    onClose={() => setShowReassignClaimHandlerModal(false)}
                    handlerId={reassignId}
                    handlerName={items.find(i => i.id === reassignId)?.name || 'Unknown'}
                    handlers={items}
                    onReassignAndDelete={handleGenericDelete}
                />
            )}

            {/* Generic Delete Warning Modal */}
            <DeleteWarningModal
                isOpen={showDeleteWarningModal}
                onClose={() => setShowDeleteWarningModal(false)}
                message={deleteWarningMessage}
            />

        </>
    );
};

export default ManagementSidebar;
