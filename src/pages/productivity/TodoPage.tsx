import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BorderTrail } from "@/components/ui/border-trail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  Target,
  Timer
} from "lucide-react";
import { TodoService, Todo } from "@/lib/productivityService";
import { formatDistanceToNow } from "date-fns";
import { CalendarWithTime } from "@/components/ui/calendar-with-time";
import { CalendarWithTimeEnhanced } from "@/components/ui/calendar-with-time-enhanced";

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  urgent: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200'
};

const TodoPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general',
    due_date: undefined as Date | undefined,
    tags: [] as string[],
    newTag: ''
  });

  useEffect(() => {
    loadTodos();
    loadCategories();
    loadStats();
  }, []);

  useEffect(() => {
    loadTodos();
  }, [activeTab, selectedCategory, selectedPriority, searchTerm]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      
      if (activeTab === 'completed') filters.completed = true;
      if (activeTab === 'pending') filters.completed = false;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (selectedPriority !== 'all') filters.priority = selectedPriority;
      if (searchTerm) filters.search = searchTerm;

      const data = await TodoService.getTodos(filters);
      setTodos(data);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await TodoService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await TodoService.getTodoStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateTodo = async () => {
    if (!formData.title.trim()) return;

    try {
      let finalDueDate: string | undefined;
      
      if (formData.due_date) {
        // Set due date to end of day (11:59 PM) for better UX
        const dueDateTime = new Date(formData.due_date);
        dueDateTime.setHours(23, 59, 59, 999);
        finalDueDate = dueDateTime.toISOString();
      }

      const todoData = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        priority: formData.priority,
        category: formData.category,
        due_date: finalDueDate,
        tags: formData.tags,
        completed: false
      };

      await TodoService.createTodo(todoData);
      resetForm();
      setShowCreateDialog(false);
      loadTodos();
      loadStats();
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || !formData.title.trim()) return;

    try {
      let finalDueDate: string | undefined;
      
      if (formData.due_date) {
        // Set due date to end of day (11:59 PM) for better UX
        const dueDateTime = new Date(formData.due_date);
        dueDateTime.setHours(23, 59, 59, 999);
        finalDueDate = dueDateTime.toISOString();
      }

      await TodoService.updateTodo(editingTodo.id, {
        title: formData.title.trim(),
        description: formData.description || undefined,
        priority: formData.priority,
        category: formData.category,
        due_date: finalDueDate,
        tags: formData.tags
      });
      
      setEditingTodo(null);
      resetForm();
      loadTodos();
      loadStats();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      await TodoService.updateTodo(todo.id, {
        completed: !todo.completed
      });
      loadTodos();
      loadStats();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleDeleteTodo = async () => {
    if (!todoToDelete) return;

    try {
      await TodoService.deleteTodo(todoToDelete);
      setTodoToDelete(null);
      setShowDeleteDialog(false);
      loadTodos();
      loadStats();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    
    let dueDate: Date | undefined = undefined;
    
    if (todo.due_date) {
      dueDate = new Date(todo.due_date);
    }
    
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category,
      due_date: dueDate,
      tags: todo.tags,
      newTag: ''
    });
  };

  const confirmDelete = (todoId: string) => {
    setTodoToDelete(todoId);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      due_date: undefined,
      tags: [],
      newTag: ''
    });
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const isOverdue = (todo: Todo) => {
    return !todo.completed && todo.due_date && new Date(todo.due_date) < new Date();
  };

  const getFilteredTodos = () => {
    if (activeTab === 'overdue') {
      return todos.filter(todo => isOverdue(todo));
    }
    return todos;
  };

  const filteredTodos = getFilteredTodos();

  return (
    <Layout>
      <div className="p-0 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">To-Do List</h1>
            <p className="text-muted-foreground mt-1 text-base">Manage your tasks and stay productive</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="lg" className="font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative">
            <BorderTrail 
              style={{
                boxShadow:
                  "0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)",
              }}
              size={100}
            />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Timer className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Overdue</p>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading tasks...</p>
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm ? 'No tasks match your search criteria.' : 'Create your first task to get started!'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <Card key={todo.id} className={`transition-all ${todo.completed ? 'opacity-60' : ''} ${isOverdue(todo) ? 'border-red-200 dark:border-red-800' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 p-0 h-auto"
                          onClick={() => handleToggleComplete(todo)}
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {todo.title}
                              </h4>
                              {todo.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {todo.description}
                                </p>
                              )}
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEdit(todo)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => confirmDelete(todo.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge className={priorityColors[todo.priority]}>
                              {todo.priority}
                            </Badge>
                            <Badge variant="outline">
                              {todo.category}
                            </Badge>
                            {todo.due_date && (
                              <div className={`flex items-center gap-1 ${isOverdue(todo) ? 'text-red-600' : ''}`}>
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(todo.due_date), { addSuffix: true })}
                              </div>
                            )}
                            {todo.tags.map(tag => (
                              <div key={tag} className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {tag}
                              </div>
                            ))}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(todo.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || !!editingTodo} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingTodo(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {editingTodo ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {editingTodo ? 'Update your task details.' : 'Add a new task to your to-do list.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input
                  placeholder="Enter task title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  placeholder="Enter task description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="resize-none h-16 text-sm"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={formData.category} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Due Date (Optional)</label>
                <CalendarWithTimeEnhanced
                  date={formData.due_date}
                  onDateSelect={(date) => setFormData(prev => ({ 
                    ...prev, 
                    due_date: date 
                  }))}
                  showTimeInputs={false}
                  showEndTime={false}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a tag..."
                    value={formData.newTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="h-8 flex-1"
                  />
                  <Button type="button" onClick={addTag} size="sm" className="h-8 px-3">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer text-xs h-5 px-2" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-6 gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTodo(null);
                  resetForm();
                }}
                className="h-9"
              >
                Cancel
              </Button>
              <Button onClick={editingTodo ? handleUpdateTodo : handleCreateTodo} className="h-9">
                {editingTodo ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteTodo}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </Layout>
  );
};

export default TodoPage;
