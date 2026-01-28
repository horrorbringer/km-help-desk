import { Button } from '@/components/ui/button';
import {
    addEdge,
    Background,
    Connection,
    Controls,
    Edge,
    Handle,
    Node,
    Panel,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CheckCircle2, Plus, UserCheck, X } from 'lucide-react';
import { useCallback, useEffect } from 'react';

// Custom Node Components
const StartNode = ({ data }: any) => {
    return (
        <div className="flex min-w-[150px] flex-col items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-100 p-4 shadow-md">
            <CheckCircle2 className="mb-1 h-6 w-6 text-emerald-600" />
            <div className="font-bold text-emerald-800">Start</div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-emerald-500"
            />
        </div>
    );
};

const ApprovalNode = ({ data, selected }: any) => {
    return (
        <div
            className={`min-w-[200px] rounded-xl border-2 bg-white p-3 shadow-sm transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-slate-400"
            />

            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <UserCheck className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-800">
                        {data.label}
                    </div>
                    <div className="text-xs text-slate-500">
                        {data.subLabel}
                    </div>
                </div>
            </div>

            {data.onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onDelete(data.id);
                    }}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500 shadow-sm hover:bg-red-200"
                >
                    <X className="h-3 w-3" />
                </button>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-blue-500"
            />
        </div>
    );
};

const EndNode = ({ data }: any) => {
    return (
        <div className="flex min-w-[150px] flex-col items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 p-4 shadow-md">
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-slate-400"
            />
            <div className="font-bold text-slate-600">End</div>
        </div>
    );
};

const nodeTypes = {
    start: StartNode,
    approval: ApprovalNode,
    end: EndNode,
};

interface WorkflowGraphEditorProps {
    steps: any[];
    onChange: (steps: any[]) => void;
    formOptions: any;
    readOnly?: boolean;
}

const WorkflowGraphEditorContent = ({
    steps,
    onChange,
    formOptions,
    readOnly = false,
}: WorkflowGraphEditorProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { screenToFlowPosition } = useReactFlow();

    // Initialize graph from steps
    useEffect(() => {
        if (nodes.length > 0) return; // Prevent re-init if already loaded

        const initialNodes: Node[] = [
            {
                id: 'start',
                type: 'start',
                position: { x: 250, y: 0 },
                data: { label: 'Start' },
            },
        ];

        const initialEdges: Edge[] = [];
        let previousNodeId = 'start';
        let yPos = 100;

        steps.forEach((step, index) => {
            const nodeId = `step-${index}`;
            initialNodes.push({
                id: nodeId,
                type: 'approval',
                position: { x: 225, y: yPos },
                data: {
                    id: index,
                    label:
                        step.type === 'approval'
                            ? 'Approval Step'
                            : 'Action Step',
                    subLabel: step.approval_level
                        ? `Level: ${step.approval_level}`
                        : 'Configured Action',
                    stepData: step,
                    onDelete: readOnly
                        ? undefined
                        : (id: number) => handleDeleteStep(index),
                },
            });

            initialEdges.push({
                id: `e-${previousNodeId}-${nodeId}`,
                source: previousNodeId,
                target: nodeId,
                animated: true,
                style: { stroke: '#64748b', strokeWidth: 2 },
            });

            previousNodeId = nodeId;
            yPos += 150;
        });

        initialNodes.push({
            id: 'end',
            type: 'end',
            position: { x: 250, y: yPos },
            data: { label: 'End' },
        });

        initialEdges.push({
            id: `e-${previousNodeId}-end`,
            source: previousNodeId,
            target: 'end',
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, []); // Run once on mount

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        animated: true,
                        style: { stroke: '#64748b', strokeWidth: 2 },
                    },
                    eds,
                ),
            ),
        [setEdges],
    );

    const handleDeleteStep = (indexToRemove: number) => {
        // Remove step logic - simply update the parent form state
        // The parent will re-render this component with new steps
        const newSteps = steps.filter((_, i) => i !== indexToRemove);
        onChange(newSteps);

        // We need to force graph update - simple way is to clear nodes so useEffect re-runs
        // In a production app we'd diff the graph, but for "toy" prototype this is fine
        setNodes([]);
    };

    const handleAddStep = () => {
        const newStep = {
            step_id: steps.length + 1,
            type: 'approval',
            approval_level: 'lm',
            approver_type: 'line_manager',
        };
        const newSteps = [...steps, newStep];
        onChange(newSteps);
        setNodes([]); // Force re-render
    };

    // Keep graph synced when steps change externally (or from our own add/delete)
    useEffect(() => {
        if (nodes.length === 0 && steps.length >= 0) {
            const initialNodes: Node[] = [
                {
                    id: 'start',
                    type: 'start',
                    position: { x: 250, y: 0 },
                    data: { label: 'Start' },
                },
            ];

            const initialEdges: Edge[] = [];
            let previousNodeId = 'start';
            let yPos = 150;

            steps.forEach((step, index) => {
                const nodeId = `step-${index}`;
                initialNodes.push({
                    id: nodeId,
                    type: 'approval',
                    position: { x: 225, y: yPos },
                    data: {
                        id: index,
                        label: getStepLabel(step, formOptions),
                        subLabel: getStepSubLabel(step, formOptions),
                        stepData: step,
                        onDelete: readOnly
                            ? undefined
                            : () => handleDeleteStep(index),
                    },
                });

                initialEdges.push({
                    id: `e-${previousNodeId}-${nodeId}`,
                    source: previousNodeId,
                    target: nodeId,
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                });

                previousNodeId = nodeId;
                yPos += 150;
            });

            initialNodes.push({
                id: 'end',
                type: 'end',
                position: { x: 250, y: yPos },
                data: { label: 'End' },
            });

            initialEdges.push({
                id: `e-${previousNodeId}-end`,
                source: previousNodeId,
                target: 'end',
                animated: true,
                style: { stroke: '#94a3b8', strokeWidth: 2 },
            });

            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, [steps, nodes.length]);

    return (
        <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
                {!readOnly && (
                    <Panel position="top-right">
                        <Button onClick={handleAddStep} className="shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Step
                        </Button>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
};

// Helper functions for labels
function getStepLabel(step: any, options: any) {
    if (step.type === 'approval') return 'Approval Step';
    if (step.type === 'notification') return 'Notification';
    if (step.type === 'routing') return 'Route Ticket';
    return 'Action Step';
}

function getStepSubLabel(step: any, options: any) {
    if (step.type === 'approval') {
        const level = options.approval_levels.find(
            (l: any) => l.value === step.approval_level,
        );
        return level ? level.label : step.approval_level;
    }
    return 'Configured Action';
}

// Wrapper to provide context
export default function WorkflowGraphEditor(props: WorkflowGraphEditorProps) {
    return (
        <ReactFlowProvider>
            <WorkflowGraphEditorContent {...props} />
        </ReactFlowProvider>
    );
}
