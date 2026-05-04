'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MOCK_DOCUMENTS = [
  {
    id: '1',
    title: 'Hướng dẫn chăm sóc răng miệng',
    filename: 'dental_care_guide.pdf',
    uploadedBy: 'Admin User',
    uploadedAt: '2026-04-15T10:00:00Z',
    size: 2500000, // bytes
    chunks: 45,
    vectorIds: ['vec_1', 'vec_2', 'vec_3'],
  },
  {
    id: '2',
    title: 'Quy trình điều trị sâu răng',
    filename: 'cavity_treatment.pdf',
    uploadedBy: 'Admin User',
    uploadedAt: '2026-04-20T14:30:00Z',
    size: 1800000,
    chunks: 32,
    vectorIds: ['vec_4', 'vec_5'],
  },
  {
    id: '3',
    title: 'Hướng dẫn chỉnh nha',
    filename: 'orthodontics_guide.pdf',
    uploadedBy: 'Admin User',
    uploadedAt: '2026-04-25T09:15:00Z',
    size: 3200000,
    chunks: 58,
    vectorIds: ['vec_6', 'vec_7', 'vec_8'],
  },
]

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setTitle(e.target.files[0].name.replace('.pdf', ''))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      alert('Vui lòng chọn file và nhập tiêu đề')
      return
    }

    setUploading(true)

    try {
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newDoc = {
        id: String(documents.length + 1),
        title,
        filename: selectedFile.name,
        uploadedBy: 'Admin User',
        uploadedAt: new Date().toISOString(),
        size: selectedFile.size,
        chunks: Math.floor(Math.random() * 50) + 20,
        vectorIds: [`vec_${Date.now()}`],
      }

      setDocuments([newDoc, ...documents])
      setSelectedFile(null)
      setTitle('')
      alert('Upload thành công!')
    } catch (error) {
      alert('Upload thất bại')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này? Vector embeddings cũng sẽ bị xóa khỏi Pinecone.')) {
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setDocuments(documents.filter((doc) => doc.id !== id))
      alert('Đã xóa tài liệu!')
    } catch (error) {
      alert('Xóa thất bại')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý tài liệu cho AI chatbot
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng tài liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng chunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.reduce((sum, doc) => sum + doc.chunks, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dung lượng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>📤 Upload tài liệu mới</CardTitle>
          <CardDescription>
            Upload file PDF để thêm vào Knowledge Base. File sẽ được xử lý và lưu vào Pinecone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề tài liệu</Label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Chọn file PDF</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Đã chọn: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title || uploading}
            className="w-full"
          >
            {uploading ? '⏳ Đang upload và xử lý...' : '📤 Upload'}
          </Button>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Quá trình upload bao gồm:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside mt-2">
              <li>Upload file lên server</li>
              <li>Trích xuất text từ PDF</li>
              <li>Chia thành chunks</li>
              <li>Tạo embeddings</li>
              <li>Lưu vào Pinecone vector database</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📚 Tài liệu hiện có</h2>

        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{doc.title}</CardTitle>
                  <CardDescription>{doc.filename}</CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                >
                  🗑️ Xóa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Upload bởi</p>
                    <p className="font-medium">{doc.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày upload</p>
                    <p className="font-medium">
                      {new Date(doc.uploadedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Dung lượng</p>
                    <p className="font-medium">{formatFileSize(doc.size)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số chunks</p>
                    <p className="font-medium">{doc.chunks} chunks</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vector IDs</p>
                    <p className="text-sm">{doc.vectorIds.length} vectors trong Pinecone</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1">
                  👁️ Xem nội dung
                </Button>
                <Button variant="outline" className="flex-1">
                  📊 Xem chunks
                </Button>
                <Button variant="outline" className="flex-1">
                  🔄 Reindex
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
