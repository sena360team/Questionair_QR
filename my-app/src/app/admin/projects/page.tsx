'use client';

import { useState, useRef } from 'react';
import { useProjects } from '@/hooks/useSupabase';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Upload,
  FileSpreadsheet,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, ProjectCreateInput } from '@/types';

const ITEMS_PER_PAGE = 20;

export default function ProjectsPage() {
  const { projects, loading, createProject, updateProject, deleteProject, importProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [importData, setImportData] = useState<ProjectCreateInput[] | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      
      import('xlsx').then(XLSX => {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        const parsed: ProjectCreateInput[] = [];
        // Skip header row (row 0)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length >= 2 && row[0] && row[1]) {
            parsed.push({
              code: String(row[0]).trim(),
              name: String(row[1]).trim(),
              description: '',
              is_active: true
            });
          }
        }
        setImportData(parsed);
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!importData || importData.length === 0) return;
    await importProjects(importData);
    setImportData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const data = [
      ['รหัสโครงการ', 'ชื่อโครงการ']
    ];
    
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'โครงการ');
      XLSX.writeFile(wb, 'project-import-template.xlsx');
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">โครงการ</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">Import (.xlsx)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">เพิ่มโครงการ</span>
          </button>
        </div>
      </div>

      {/* Import Preview */}
      {importData && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-medium text-slate-900">ตรวจสอบข้อมูลนำเข้า</h3>
                <p className="text-sm text-slate-500">พบ {importData.length} รายการ</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportData(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                นำเข้า {importData.length} รายการ
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg overflow-hidden border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-2 px-4 font-medium">รหัสโครงการ</th>
                  <th className="text-left py-2 px-4 font-medium">ชื่อโครงการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {importData.slice(0, 5).map((item, i) => (
                  <tr className="border-b border-slate-200" key={i}>
                    <td className="py-2 px-4 font-mono text-slate-600">{item.code}</td>
                    <td className="py-2 px-4">{item.name}</td>
                  </tr>
                ))}
                {importData.length > 5 && (
                  <tr>
                    <td colSpan={2} className="py-2 px-4 text-slate-400 text-center">
                      ... และอีก {importData.length - 5} รายการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search & Template */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาโครงการ..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">Template (.xlsx)</span>
        </button>
      </div>

      {/* Projects Table - Full Width */}
      <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">ไม่พบข้อมูลโครงการ</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 w-32">รหัสโครงการ</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700">ชื่อโครงการ</th>
                    <th className="text-center py-3 px-6 font-semibold text-slate-700 w-28">สถานะ</th>
                    <th className="text-right py-3 px-6 font-semibold text-slate-700 w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedProjects.map((project) => (
                    <tr className="border-b border-slate-200" key={project.id} className="hover:bg-slate-50">
                      <td className="py-3 px-6">
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {project.code}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-900">{project.name}</td>
                      <td className="py-3 px-6 text-center">
                        {project.is_active ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle2 className="w-4 h-4" /> ใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
                            <XCircle className="w-4 h-4" /> ปิด
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingProject(project)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteId(project.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-300">
                <div className="text-sm text-slate-600">
                  แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} จาก {filteredProjects.length} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium">
                    หน้า {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProject) && (
        <ProjectModal
          project={editingProject}
          onClose={() => { setShowCreateModal(false); setEditingProject(null); }}
          onSave={async (data) => {
            if (editingProject) {
              await updateProject(editingProject.id, data);
            } else {
              await createProject(data);
            }
            setShowCreateModal(false);
            setEditingProject(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-900 mb-2">ยืนยันการลบ?</h3>
            <p className="text-slate-500 text-sm mb-4">การลบไม่สามารถเรียกคืนได้</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteId(null)}
                className="flex-1 py-2 border-2 border-slate-300 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => { deleteProject(showDeleteId); setShowDeleteId(null); }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectModal({ 
  project, 
  onClose, 
  onSave 
}: { 
  project: Project | null;
  onClose: () => void;
  onSave: (data: ProjectCreateInput) => void;
}) {
  const [code, setCode] = useState(project?.code || '');
  const [name, setName] = useState(project?.name || '');
  const [isActive, setIsActive] = useState(project?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ code, name, description: '', is_active: isActive });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {project ? 'แก้ไขโครงการ' : 'เพิ่มโครงการ'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              รหัสโครงการ *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="BGHBK"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              ชื่อโครงการ *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="กรุณากรอกชื่อโครงการ"
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-slate-700">ใช้งาน</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border-2 border-slate-300 rounded-lg"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-green-600 text-white rounded-lg"
            >
              {project ? 'บันทึก' : 'เพิ่มโครงการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
