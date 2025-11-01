import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { questionSetService } from "../services/questionSetService"
import { subjectService } from "../services/subjectService"
import { QuestionSet, Subject } from "../types"
import "./Dashboard.css"

export default function Dashboard() {
  const [toeicSets, setToeicSets] = useState<QuestionSet[]>([])
  const [schoolSets, setSchoolSets] = useState<QuestionSet[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<"all" | "toeic" | "school">("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("")

  useEffect(() => {
    loadQuestionSets()
    loadSubjects()
  }, [])

  useEffect(() => {
    loadQuestionSets()
  }, [selectedSubject])

  const loadSubjects = async () => {
    try {
      const allSubjects = await subjectService.getAll()
      setSubjects(allSubjects)
    } catch (error) {
      console.error("Failed to load subjects", error)
    }
  }

  const loadQuestionSets = async () => {
    try {
      const [toeic, school] = await Promise.all([
        questionSetService.getAll("TOEIC", selectedSubject),
        questionSetService.getAll("SCHOOL", selectedSubject),
      ])
      setToeicSets(toeic)
      setSchoolSets(school)
    } catch (error) {
      console.error("Failed to load question sets", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter question sets based on search query
  const filterSets = (sets: QuestionSet[]) => {
    if (!searchQuery.trim()) return sets

    const query = searchQuery.toLowerCase().trim()
    return sets.filter(
      (set) =>
        set.title.toLowerCase().includes(query) || set.description?.toLowerCase().includes(query)
    )
  }

  const filteredToeicSets = filterSets(toeicSets)
  const filteredSchoolSets = filterSets(schoolSets)

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="container">
      {/* Search and Filter Bar */}
      <div className="search-filter-container">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterMode === "all" ? "active" : ""}`}
            onClick={() => {
              setFilterMode("all")
              setSelectedSubject("")
            }}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterMode === "toeic" ? "active" : ""}`}
            onClick={() => {
              setFilterMode("toeic")
              setSelectedSubject("")
            }}
          >
            📚 TOEIC
          </button>
          <button
            className={`filter-btn ${filterMode === "school" ? "active" : ""}`}
            onClick={() => setFilterMode("school")}
          >
            🎓 Trắc nghiệm
          </button>
        </div>

        {/* Subject Filter - Only show for school mode */}
        {filterMode === "school" && subjects.length > 0 && (
          <div className="subject-filter">
            <select
              className="subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Tất cả môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {(filterMode === "all" || filterMode === "toeic") && (
        <section className="quiz-section">
          <h2 className="section-title">📚 Luyện TOEIC Reading</h2>
          <div className="quiz-grid">
            {filteredToeicSets.map((set) => (
              <QuizCard key={set.id} questionSet={set} />
            ))}
            {filteredToeicSets.length === 0 && !searchQuery && (
              <p className="no-data">Chưa có bài kiểm tra TOEIC nào.</p>
            )}
            {filteredToeicSets.length === 0 && searchQuery && (
              <p className="no-data">Không tìm thấy bài kiểm tra TOEIC phù hợp.</p>
            )}
          </div>
        </section>
      )}

      {(filterMode === "all" || filterMode === "school") && (
        <section className="quiz-section">
          <h2 className="section-title">🎓 Luyện Thi Trắc Nghiệm</h2>
          <div className="quiz-grid">
            {filteredSchoolSets.map((set) => (
              <QuizCard key={set.id} questionSet={set} />
            ))}
            {filteredSchoolSets.length === 0 && !searchQuery && (
              <p className="no-data">Chưa có bài kiểm tra trắc nghiệm nào.</p>
            )}
            {filteredSchoolSets.length === 0 && searchQuery && (
              <p className="no-data">Không tìm thấy bài kiểm tra trắc nghiệm phù hợp.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function QuizCard({ questionSet }: { questionSet: QuestionSet }) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Vừa xong"
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    if (diffInHours < 48) return "Hôm qua"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`

    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" })
  }

  // Determine badge class based on score
  const getBadgeClass = () => {
    if (!questionSet.userProgress?.score) return "badge-info"
    const score = questionSet.userProgress.score
    if (score >= 80) return "badge-success"
    if (score >= 50) return "badge-warning"
    return "badge-error"
  }

  return (
    <div className="quiz-card card">
      <div className="quiz-card-header">
        <div className="quiz-card-title-row">
          <h4 className="quiz-card-title">{questionSet.title}</h4>
          {questionSet.subject && (
            <span 
              className="subject-badge" 
              style={{ 
                backgroundColor: questionSet.subject.color || '#3B82F6',
                color: '#fff'
              }}
            >
              {questionSet.subject.name}
            </span>
          )}
        </div>
        {questionSet.userProgress ? (
          <span className={`badge ${getBadgeClass()}`}>
            {questionSet.userProgress.score?.toFixed(0)}% | Đúng:{" "}
            {questionSet.userProgress.correctAnswers}/{questionSet.userProgress.totalQuestions}
          </span>
        ) : (
          <span className="badge badge-info">Mới</span>
        )}
      </div>

      {questionSet.description && (
        <p className="quiz-card-description">{questionSet.description}</p>
      )}

      <div className="quiz-card-meta">
        <span className="meta-item">📝 {questionSet._count?.questions || 0} câu hỏi</span>
        {questionSet.timeLimit && (
          <span className="meta-item">⏱️ {Math.floor(questionSet.timeLimit / 60)} phút</span>
        )}
        {questionSet.userProgress && (
            <p className="progress-details">
              {questionSet.userProgress.completedAt && (
                <> {formatDate(questionSet.userProgress.completedAt)}</>
              )}
            </p>
        )}
      </div>

      <Link to={`/quiz/${questionSet.id}/config`} className="btn btn-primary w-full">
        {questionSet.userProgress ? "Làm lại" : "Bắt đầu"}
      </Link>
    </div>
  )
}
