import { Button, Popconfirm, Space, Tag, type TableProps } from "antd";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Unit } from "@/features/units/schema";
type UnitColumnActions = {
    offset: number;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    isDeleting: boolean;
    deletingId?: number;
};
export function getUnitColumns({ offset, onView, onEdit, onDelete, isDeleting, deletingId, }: UnitColumnActions): NonNullable<TableProps<Unit>["columns"]> {
    return [
        { title: "#", key: "index", width: 70, render: (_, __, index) => offset + index + 1 },
        { title: "Code", dataIndex: "code" },
        { title: "Name", dataIndex: "name" },
        { title: "Symbol", dataIndex: "symbol" },
        {
            title: "Status",
            dataIndex: "status",
            render: (status: string) => (<Tag color={status === "active" ? "green" : "default"}>
          {status}
        </Tag>),
        },
        {
            title: "Actions",
            render: (_, unit) => (<Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true"/>} aria-label={`View unit ${unit.name}`} title="View unit" onClick={() => onView(unit.id)}/>
          <Button size="small" icon={<Pencil size={16} aria-hidden="true"/>} aria-label={`Edit unit ${unit.name}`} title="Edit unit" onClick={() => onEdit(unit.id)}/>
          <Popconfirm title="Delete unit?" description="This action cannot be undone." onConfirm={() => {
                    if (!isDeleting)
                        onDelete(unit.id);
                }} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<Trash2 size={16} aria-hidden="true"/>} aria-label={`Delete unit ${unit.name}`} title="Delete unit" disabled={isDeleting} loading={isDeleting && deletingId === unit.id}/>
          </Popconfirm>
        </Space>),
        },
    ];
}
