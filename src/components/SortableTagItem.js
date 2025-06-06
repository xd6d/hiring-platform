import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {GripVertical, X} from "lucide-react";
import React from "react";

const SortableTagItem = ({tag, onRemove}) => {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: tag.id});
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between border border-gray-200 px-3 py-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center">
                <GripVertical
                    className="cursor-move mr-2 text-gray-400 hover:text-gray-600" {...attributes} {...listeners} />
                <span className="text-gray-700">{tag.name}</span>
            </div>
            <button
                onClick={() => onRemove(tag.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
            >
                <X size={16}/>
            </button>
        </div>
    );
};

export default SortableTagItem;