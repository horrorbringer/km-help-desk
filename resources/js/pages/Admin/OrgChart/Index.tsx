import { Head, usePage } from '@inertiajs/react';
import {
    Background,
    Controls,
    Edge,
    Handle,
    Node,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChevronDown, ChevronRight, Search, Users, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface User {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
}

interface RoleNodeData {
    id: number;
    name: string;
    hierarchy_level: number;
    parent_id: number | null;
    users: User[];
    users_count: number;
    children: RoleNodeData[];
    // State for UI
    collapsed?: boolean;
    onToggle?: (id: number) => void;
    // Helper to find partial matches
    matchesSearch?: boolean;
    [key: string]: unknown;
}

interface OrgChartProps extends PageProps {
    tree: RoleNodeData[];
    roles: any[];
}

// ============================================================================
// CUSTOM NODE COMPONENT
// ============================================================================

const RoleNodeComponent = ({ data }: { data: RoleNodeData }) => {
    const hasChildren = data.users_count >= 0; // Always true practically, but logical check for collapse

    // Initials helper
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className={`
            group relative w-[260px] rounded-lg border bg-white shadow-sm transition-all duration-300
            ${data.matchesSearch ? 'ring-2 ring-primary border-primary' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}
        `}>
            {/* Input Handle (Top) */}
            {data.parent_id !== null && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!h-2 !w-2 !bg-slate-300 group-hover:!bg-slate-400"
                />
            )}

            <div className="p-3">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-0.5">
                            Level {data.hierarchy_level}
                        </p>
                        <h3 className="font-bold text-sm text-slate-800 leading-tight truncate" title={data.name}>
                            {data.name}
                        </h3>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 my-3" />

                {/* Users Section */}
                <div>
                    {data.users && data.users.length > 0 ? (
                        <div className="flex items-center justify-between">
                            <div className="flex -space-x-2 overflow-hidden py-1">
                                {data.users.slice(0, 5).map((user) => (
                                    <TooltipProvider key={user.id}>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <Avatar className="h-8 w-8 ring-2 ring-white cursor-pointer transition-transform hover:z-10 hover:scale-110">
                                                    <AvatarImage src={user.avatar || undefined} />
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px]">
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-medium text-xs">{user.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                            {data.users.length > 5 && (
                                <span className="text-xs text-slate-400 font-medium pl-2">
                                    +{data.users.length - 5}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 py-1 opacity-50">
                            <div className="h-8 w-8 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                                <Users className="h-3 w-3 text-slate-400" />
                            </div>
                            <span className="text-xs text-slate-400 italic">Vacant</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Collapse/Expand Component - Only if there are children in the data structure from backend */}
            {data.children && data.children.length > 0 && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        if (data.onToggle) data.onToggle(data.id);
                    }}
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 
                               flex h-6 w-6 items-center justify-center rounded-full 
                               bg-white border text-slate-500 shadow-sm
                               hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                    {data.collapsed ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
                    )}
                </button>
            )}

            {/* Output Handle (Bottom) */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!h-2 !w-2 !bg-slate-300 group-hover:!bg-slate-400"
            />
        </div>
    );
};

// ============================================================================
// CANVAS COMPONENT
// ============================================================================

const OrgChartCanvas = ({ tree }: { tree: RoleNodeData[] }) => {
    const { fitView } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<RoleNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // State to track collapsed nodes (Set of IDs)
    const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    const nodeTypes = useMemo(() => ({
        role: RoleNodeComponent,
    }), []);

    // Toggle collapse state
    const handleToggle = useCallback((id: number) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Handle initial fit view and search focusing
    useEffect(() => {
        if (searchQuery && nodes.length > 0) {
            const matchedNode = nodes.find(n => 
                n.data.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            if (matchedNode) {
                fitView({
                    nodes: [matchedNode],
                    duration: 800,
                    padding: 0.5,
                });
            }
        }
    }, [searchQuery, nodes, fitView]);

    // Layout Algorithm
    useEffect(() => {
        if (!tree || tree.length === 0) return;

        const generatedNodes: Node<RoleNodeData>[] = [];
        const generatedEdges: Edge[] = [];

        // Config
        const NODE_WIDTH = 260;
        const NODE_HEIGHT = 160;
        const SIBLING_GAP = 40;
        const LEVEL_GAP = 220;

        const measuredNodes = new Map<number, number>(); // id -> width of subtree

        const measure = (node: RoleNodeData): number => {
            const isCollapsed = collapsedIds.has(node.id);

            if (isCollapsed || !node.children || node.children.length === 0) {
                measuredNodes.set(node.id, NODE_WIDTH);
                return NODE_WIDTH;
            }

            let width = 0;
            node.children.forEach((child, i) => {
                width += measure(child);
                if (i < node.children.length - 1) width += SIBLING_GAP;
            });

            measuredNodes.set(node.id, Math.max(width, NODE_WIDTH));
            return Math.max(width, NODE_WIDTH);
        };

        const layout = (node: RoleNodeData, x: number, y: number) => {
            const width = measuredNodes.get(node.id) || NODE_WIDTH;
            const nodeX = x + (width / 2) - (NODE_WIDTH / 2);

            // Check if matches search
            const matches = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

            generatedNodes.push({
                id: String(node.id),
                type: 'role',
                position: { x: nodeX, y: y },
                data: {
                    ...node,
                    collapsed: collapsedIds.has(node.id),
                    onToggle: handleToggle,
                    matchesSearch: !!matches
                },
            });

            const isCollapsed = collapsedIds.has(node.id);

            // If not collapsed, process children
            if (!isCollapsed && node.children && node.children.length > 0) {
                let currentX = x;
                node.children.forEach(child => {
                    const childWidth = measuredNodes.get(child.id) || NODE_WIDTH;

                    layout(child, currentX, y + LEVEL_GAP);

                    // Step Edge
                    generatedEdges.push({
                        id: `e-${node.id}-${child.id}`,
                        source: String(node.id),
                        target: String(child.id),
                        type: 'step',
                        animated: !!matches,
                        style: { stroke: matches ? '#3b82f6' : '#94a3b8', strokeWidth: 2 },
                    });

                    currentX += childWidth + SIBLING_GAP;
                });
            }
        };

        // Initialize layout
        let rootX = 0;
        tree.forEach((root, index) => {
            const w = measure(root);
            layout(root, rootX, 50);
            rootX += w + 200; // Large gap between different roots
        });

        setNodes(generatedNodes);
        setEdges(generatedEdges);

    }, [tree, collapsedIds, handleToggle, searchQuery]);

    return (
        <div className="relative h-full w-full bg-slate-50/50">
            {/* Toolbar Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="relative w-72 bg-white rounded-lg shadow-lg border border-slate-200">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Quick filter by name..."
                        className="pl-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-white shadow-sm border border-slate-200 h-9"
                        onClick={() => fitView({ duration: 800 })}
                    >
                        Reset Zoom
                    </Button>
                    {searchQuery && (
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="bg-slate-100 h-9 text-slate-500"
                            onClick={() => setSearchQuery('')}
                        >
                            Clear search
                        </Button>
                    )}
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, duration: 800 }}
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{ type: 'step' }}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#e2e8f0" gap={20} size={1} />
                <Controls
                    className="!bg-white !border-slate-200 !shadow-sm !m-4"
                    showInteractive={false}
                />
            </ReactFlow>
        </div>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function OrgChartIndex() {
    const { tree } = usePage<OrgChartProps>().props;

    return (
        <AppLayout>
            <Head title="Organization Chart" />

            <div className="flex h-[calc(100vh-6rem)] flex-col space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Structure</h1>
                        <p className="text-muted-foreground text-sm">
                            Visual hierarchy of roles and reporting lines
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {tree.length > 0 ? (
                        <ReactFlowProvider>
                            <OrgChartCanvas tree={tree} />
                        </ReactFlowProvider>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400">
                            <div className="text-center">
                                <Users className="mx-auto h-12 w-12 opacity-50 mb-2" />
                                <p>No organizational structure found</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
