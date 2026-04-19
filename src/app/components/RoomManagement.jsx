import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Search, Plus, Pencil, Trash2, DoorOpen, Monitor } from "lucide-react";
function RoomManagement() {
  const { rooms, setRooms } = useStore();
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    building: "Main Block",
    floor: 0,
    capacity: 30,
    hasProjector: false,
    isAvailable: true
  });
  const buildings = useMemo(
    () => [...new Set(rooms.map((r) => r.building))],
    [rooms]
  );
  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch = r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase());
      const matchBuilding = buildingFilter === "all" || r.building === buildingFilter;
      return matchSearch && matchBuilding;
    });
  }, [rooms, search, buildingFilter]);
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const availableRooms = rooms.filter((r) => r.isAvailable).length;
  const openAdd = () => {
    setEditingRoom(null);
    setFormData({ roomNumber: "", building: "Main Block", floor: 0, capacity: 30, hasProjector: false, isAvailable: true });
    setDialogOpen(true);
  };
  const openEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      hasProjector: room.hasProjector,
      isAvailable: room.isAvailable
    });
    setDialogOpen(true);
  };
  const handleSave = async () => {
    if (!formData.roomNumber) return;
    try {
      if (editingRoom) {
        const updated = await api.rooms.update(editingRoom.id, formData);
        setRooms((prev) => prev.map((r) => r.id === editingRoom.id ? { ...r, ...updated } : r));
        toast.success("Room updated");
      } else {
        const created = await api.rooms.create(formData);
        setRooms((prev) => [...prev, created]);
        toast.success("Room added");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save room");
    }
  };
  const handleDelete = async (id) => {
    try {
      await api.rooms.delete(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
      toast.success("Room deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete room");
    }
  };
  const toggleAvailability = async (id) => {
    const room = rooms.find((r) => r.id === id);
    if (!room) return;
    try {
      const updated = await api.rooms.update(id, { isAvailable: !room.isAvailable });
      setRooms((prev) => prev.map((r) => r.id === id ? { ...r, ...updated } : r));
    } catch (err) {
      toast.error(err.message || "Failed to update room");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { children: "Room Management" }) }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: openAdd, children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-1" }),
        " Add Room"
      ] })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-3 px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search rooms...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-9 h-9 text-[0.85rem]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: buildingFilter, onValueChange: setBuildingFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px] h-9 text-[0.85rem]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Building" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Buildings" }),
          buildings.map((b) => /* @__PURE__ */ jsx(SelectItem, { value: b, children: b }, b))
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3", children: filtered.map((room) => /* @__PURE__ */ jsx(Card, { className: `relative ${!room.isAvailable ? "opacity-60" : ""}`, children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(DoorOpen, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("span", { className: "text-[0.9rem]", children: [
            "Room ",
            room.roomNumber
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => openEdit(room), className: "p-1 rounded hover:bg-accent", children: /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5 text-muted-foreground" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(room.id), className: "p-1 rounded hover:bg-accent", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 text-destructive" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 text-[0.8rem]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Building" }),
          /* @__PURE__ */ jsx("span", { children: room.building })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Floor" }),
          /* @__PURE__ */ jsx("span", { children: room.floor })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Capacity" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: room.capacity })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-3 pt-3 border-t border-border", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: room.hasProjector && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[0.65rem] py-0", children: [
          /* @__PURE__ */ jsx(Monitor, { className: "w-3 h-3 mr-1" }),
          " Projector"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[0.7rem] text-muted-foreground", children: room.isAvailable ? "Available" : "Unavailable" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: room.isAvailable,
              onCheckedChange: () => toggleAvailability(room.id),
              className: "scale-75"
            }
          )
        ] })
      ] })
    ] }) }, room.id)) }),
    /* @__PURE__ */ jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: editingRoom ? "Edit Room" : "Add New Room" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: editingRoom ? "Make changes to the room details." : "Enter the room details." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Room Number" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: formData.roomNumber,
                onChange: (e) => setFormData({ ...formData, roomNumber: e.target.value }),
                className: "text-[0.85rem]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Floor" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: formData.floor,
                onChange: (e) => setFormData({ ...formData, floor: Number(e.target.value) }),
                className: "text-[0.85rem]"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Building" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: formData.building,
              onChange: (e) => setFormData({ ...formData, building: e.target.value }),
              className: "text-[0.85rem]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Capacity" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              value: formData.capacity,
              onChange: (e) => setFormData({ ...formData, capacity: Number(e.target.value) }),
              className: "text-[0.85rem]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: formData.hasProjector,
              onCheckedChange: (c) => setFormData({ ...formData, hasProjector: c })
            }
          ),
          /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Has Projector" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: formData.isAvailable,
              onCheckedChange: (c) => setFormData({ ...formData, isAvailable: c })
            }
          ),
          /* @__PURE__ */ jsx(Label, { className: "text-[0.8rem]", children: "Available for Exams" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDialogOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleSave, children: editingRoom ? "Update" : "Add Room" })
      ] })
    ] }) })
  ] });
}
export {
  RoomManagement
};
