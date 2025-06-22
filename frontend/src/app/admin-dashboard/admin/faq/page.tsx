"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  BookOpen
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DialogFooter } from "@/components/ui/dialog"

interface FAQ {
  id: number
  question: string
  answer: string
  created_at: string
}

export default function FAQManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentFaq, setCurrentFaq] = useState<FAQ | null>(null)
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")

  useEffect(() => {
    // Mock data for demonstration purposes
    const mockFaqs: FAQ[] = [
      {
        id: 1,
        question: "How do I create a post?",
        answer: "To create a post, you need to be logged in and click the 'Create Post' button...",
        created_at: "2024-01-15T08:00:00.000000Z"
      },
      {
        id: 2,
        question: "Why is my post pending approval?",
        answer: "All posts go through a moderation process to ensure they meet our community guidelines...",
        created_at: "2024-01-15T08:00:00.000000Z"
      },
      {
        id: 3,
        question: "How long does post approval take?",
        answer: "Post approval typically takes 12-24 hours during business days.",
        created_at: "2024-01-15T16:30:00.000000Z"
      },
      {
        id: 4,
        question: "Can I edit my post after submitting it?",
        answer: "Yes, you can edit your post if it's still pending approval or has been rejected. Once approved, you cannot edit it.",
        created_at: "2024-02-10T09:15:00.000000Z"
      },
      {
        id: 5,
        question: "How do I delete my account?",
        answer: "To delete your account, go to your profile settings and select the 'Delete Account' option. Note that this action is irreversible.",
        created_at: "2024-02-15T14:20:00.000000Z"
      },
    ]

    // Simulate API fetch
    setTimeout(() => {
      setFaqs(mockFaqs)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateFaq = () => {
    // Simulate API call
    const newFaq: FAQ = {
      id: faqs.length + 1,
      question: newQuestion,
      answer: newAnswer,
      created_at: new Date().toISOString()
    }
    
    setFaqs([...faqs, newFaq])
    setNewQuestion("")
    setNewAnswer("")
    setCreateDialogOpen(false)
    
    toast({
      title: "FAQ Created",
      description: "The FAQ has been successfully created.",
    })
  }

  const handleEditFaq = () => {
    if (!currentFaq) return
    
    // Simulate API call
    const updatedFaqs = faqs.map(faq => 
      faq.id === currentFaq.id 
        ? { ...faq, question: newQuestion, answer: newAnswer } 
        : faq
    )
    
    setFaqs(updatedFaqs)
    setEditDialogOpen(false)
    
    toast({
      title: "FAQ Updated",
      description: "The FAQ has been successfully updated.",
    })
  }

  const handleDeleteFaq = () => {
    if (!currentFaq) return
    
    // Simulate API call
    const updatedFaqs = faqs.filter(faq => faq.id !== currentFaq.id)
    setFaqs(updatedFaqs)
    setDeleteDialogOpen(false)
    
    toast({
      title: "FAQ Deleted",
      description: "The FAQ has been successfully deleted.",
    })
  }

  const openEditDialog = (faq: FAQ) => {
    setCurrentFaq(faq)
    setNewQuestion(faq.question)
    setNewAnswer(faq.answer)
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (faq: FAQ) => {
    setCurrentFaq(faq)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">FAQ Management</h1>
        <p className="text-gray-600">
          Manage frequently asked questions displayed to users.
        </p>
      </div>

      <Card className="mb-6 overflow-hidden border border-purple-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search FAQs..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New FAQ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create New FAQ</DialogTitle>
                  <DialogDescription>
                    Add a new question and answer to the FAQ section.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Question</label>
                    <Input 
                      placeholder="Enter the question..." 
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Answer</label>
                    <Textarea 
                      placeholder="Enter the answer..." 
                      rows={5}
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleCreateFaq}
                    disabled={!newQuestion.trim() || !newAnswer.trim()}
                  >
                    Create FAQ
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-10">
              <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No FAQs Found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm ? "Try a different search term." : "Add your first FAQ using the button above."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">ID</TableHead>
                    <TableHead className="w-[300px]">Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell className="font-medium">{faq.id}</TableCell>
                      <TableCell className="font-medium">{faq.question}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {faq.answer.length > 100 
                          ? `${faq.answer.substring(0, 100)}...` 
                          : faq.answer}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditDialog(faq)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDeleteDialog(faq)}
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update the question and answer for this FAQ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              <Input 
                placeholder="Enter the question..." 
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Answer</label>
              <Textarea 
                placeholder="Enter the answer..." 
                rows={5}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleEditFaq}
              disabled={!newQuestion.trim() || !newAnswer.trim()}
            >
              Update FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete FAQ</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-md mt-4">
            <p className="font-medium">{currentFaq?.question}</p>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteFaq}
            >
              Delete FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}