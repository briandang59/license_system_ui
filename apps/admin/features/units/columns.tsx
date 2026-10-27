import { displayLabel } from "@/lib/display-labels";
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
        { title: "Mã", dataIndex: "code" },
        { title: "Tên", dataIndex: "name" },
        { title: "Ký hiệu", dataIndex: "symbol" },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status: string) => (<Tag color={status === "active" ? "green" : "default"}>
          {displayLabel(status)}
        </Tag>),
        },
        {
            title: "Thao tác",
            render: (_, unit) => (<Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true"/>} aria-label={`Xem đơn vị tính ${unit.name}`} title="Xem đơn vị tính" onClick={() => onView(unit.id)}/>
          <Button size="small" icon={<Pencil size={16} aria-hidden="true"/>} aria-label={`Sửa đơn vị tính ${unit.name}`} title="Sửa đơn vị tính" onClick={() => onEdit(unit.id)}/>
          <Popconfirm title="Xóa đơn vị tính?" description="Không thể hoàn tác thao tác này." onConfirm={() => {
                    if (!isDeleting)
                        onDelete(unit.id);
                }} okText="Xóa" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<Trash2 size={16} aria-hidden="true"/>} aria-label={`Xóa đơn vị tính ${unit.name}`} title="Xóa đơn vị tính" disabled={isDeleting} loading={isDeleting && deletingId === unit.id}/>
          </Popconfirm>
        </Space>),
        },
    ];
}
