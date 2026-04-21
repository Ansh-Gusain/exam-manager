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
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "./ui/select";
import { Search, Plus, Pencil, Trash2, DoorOpen, Monitor, Grid2X2 } from "lucide-react";

const EMPTY_FORM = {
  roomNumber: "", building: "SOICT", floor: 1,
  rowsCount: 6, colsCount: 8,
  hasProjector: false, isAvailable: true
};

export function RoomManagement() {
  const { rooms, setRooms, refreshSeating } = useStore();
  const [search, setSearch]         = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const buildings = useMemo(() => [...new Set(rooms.map(r => r.building))], [rooms]);

  const filtered = useMemo(() => rooms.filter(r => {
    const matchSearch   = r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
                          r.building.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = buildingFilter === "all" || r.building === buildingFilter;
    return matchSearch && matchBuilding;
  }), [rooms, search, buildingFilter]);

  const openAdd = () => {
    setEditingRoom(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber:   room.roomNumber,
      building:     room.building,
      floor:        room.floor,
      rowsCount:    room.rowsCount || room.rows_count || 6,
      colsCount:    room.colsCount || room.cols_count || 8,
      hasProjector: room.hasProjector || room.has_projector || false,
      isAvailable:  room.isAvailable ?? room.is_available ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.roomNumber) { toast.error("Room number is required"); return; }
    try {
      if (editingRoom) {
        const oldRows = editingRoom.rowsCount || editingRoom.rows_count || 6;
        const oldCols = editingRoom.colsCount || editingRoom.cols_count || 8;
        const capacityChanged = oldRows !== formData.rowsCount || oldCols !== formData.colsCount;

        const updated = await api.rooms.update(editingRoom.id, formData);
        setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...updated } : r));

        if (capacityChanged) {
          // Clear seating allocations for this room since layout changed
          try {
            await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost/exam-manager/backend'}/api/seating?roomId=${editingRoom.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` }
            });
          } catch {}
          await refreshSeating();
          toast.success("Room updated. Layout changed — please re-run Auto Allocate to update seating.");
        } else {
          toast.success("Room updated");
        }
      } else {
        const created = await api.rooms.create(formData);
        setRooms(prev => [...prev, created]);
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
      setRooms(prev => prev.filter(r => r.id !== id));
      toast.success("Room deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete room");
    }
  };

  const toggleAvailability = async (id) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    try {
      const updated = await api.rooms.update(id, {
        roomNumber:   room.roomNumber,
        building:     room.building,
        floor:        room.floor,
        rowsCount:    room.rowsCount || room.rows_count || 6,
        colsCount:    room.colsCount || room.cols_count || 8,
        hasProjector: room.hasProjector || room.has_projector || false,
        isAvailable:  !(room.isAvailable ?? room.is_available),
      });
      setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    } catch (err) {
      toast.error(err.message || "Failed to update room");
    }
  };

  const capacity = (formData.rowsCount || 0) * (formData.colsCount || 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1>Room Management</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Room
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-[0.85rem]"
              />
            </div>
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="w-[180px] h-9 text-[0.85rem]">
                <SelectValue placeholder="Building" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildings.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Room cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(room => {
          const rows = room.rowsCount || room.rows_count || 6;
          const cols = room.colsCount || room.cols_count || 8;
          const cap  = room.capacity || rows * cols;
          const avail = room.isAvailable ?? room.is_available;
          return (
            <Card key={room.id} className={`relative ${!avail ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[0.9rem] font-semibold">{room.roomNumber}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(room)} className="p-1 rounded hover:bg-accent">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(room.id)} className="p-1 rounded hover:bg-accent">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-[0.8rem]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Building</span>
                    <span>{room.building}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Floor</span>
                    <span>{room.floor}</span>
                  </div>
                  {/* Rows × Cols */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Grid2X2 className="w-3 h-3" /> Layout
                    </span>
                    <span className="font-mono text-[0.78rem] bg-muted px-2 py-0.5 rounded">
                      {rows} rows × {cols} cols
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-mono font-semibold">{cap} seats</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    {(room.hasProjector || room.has_projector) && (
                      <Badge variant="secondary" className="text-[0.65rem] py-0">
                        <Monitor className="w-3 h-3 mr-1" /> Projector
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] text-muted-foreground">
                      {avail ? "Available" : "Unavailable"}
                    </span>
                    <Switch
                      checked={!!avail}
                      onCheckedChange={() => toggleAvailability(room.id)}
                      className="scale-75"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            <DialogDescription>
              Set rows and columns to define the room layout. Capacity = rows × columns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[0.8rem]">Room Number</Label>
                <Input value={formData.roomNumber} onChange={e => set("roomNumber", e.target.value)} placeholder="e.g. IL-101" className="text-[0.85rem]" />
              </div>
              <div>
                <Label className="text-[0.8rem]">Building</Label>
                <Input value={formData.building} onChange={e => set("building", e.target.value)} className="text-[0.85rem]" />
              </div>
            </div>

            <div>
              <Label className="text-[0.8rem]">Floor</Label>
              <Input type="number" value={formData.floor} onChange={e => set("floor", Number(e.target.value))} className="text-[0.85rem]" />
            </div>

            {/* Rows × Cols */}
            <div>
              <Label className="text-[0.8rem] mb-2 block flex items-center gap-1">
                <Grid2X2 className="w-3.5 h-3.5" /> Room Layout (Rows × Columns)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[0.75rem] text-muted-foreground">Rows</Label>
                  <Input
                    type="number" min={1} max={20}
                    value={formData.rowsCount}
                    onChange={e => set("rowsCount", Math.max(1, Number(e.target.value)))}
                    className="text-[0.85rem] font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[0.75rem] text-muted-foreground">Columns (must be even)</Label>
                  <Input
                    type="number" min={2} max={20} step={2}
                    value={formData.colsCount}
                    onChange={e => {
                      let v = Math.max(2, Number(e.target.value));
                      if (v % 2 !== 0) v++;
                      set("colsCount", v);
                    }}
                    className="text-[0.85rem] font-mono"
                  />
                </div>
              </div>
              {/* Live preview */}
              <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-[0.75rem] text-muted-foreground mb-2 font-medium">Layout Preview</p>
                <div className="flex items-center gap-3">
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.min(formData.colsCount, 12)}, 1fr)` }}>
                    {Array.from({ length: Math.min(formData.rowsCount * formData.colsCount, 96) }).map((_, i) => {
                      const col = i % formData.colsCount;
                      const isA = col % 2 === 0;
                      return (
                        <div key={i} className={`w-3 h-3 rounded-sm border ${isA ? "bg-blue-200 border-blue-300" : "bg-green-200 border-green-300"}`} />
                      );
                    })}
                  </div>
                  <div className="text-[0.75rem] space-y-1">
                    <p className="font-semibold">{formData.rowsCount} × {formData.colsCount}</p>
                    <p className="text-primary font-bold">{capacity} seats</p>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-200 border border-blue-300 inline-block"></span> <span className="text-[0.68rem]">Exam A</span></span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-200 border border-green-300 inline-block"></span> <span className="text-[0.68rem]">Exam B</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={formData.hasProjector} onCheckedChange={v => set("hasProjector", v)} />
              <Label className="text-[0.8rem]">Has Projector</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formData.isAvailable} onCheckedChange={v => set("isAvailable", v)} />
              <Label className="text-[0.8rem]">Available for Exams</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingRoom ? "Update" : "Add Room"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RoomManagement;
