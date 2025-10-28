import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { questionSetService } from "../services/questionSetService"
import { QuestionSet } from "../types"
import "./Dashboard.css"

export default function Dashboard() {
  const [toeicSets, setToeicSets] = useState<QuestionSet[]>([])
  const [schoolSets, setSchoolSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<"all" | "toeic" | "school">("all")

  useEffect(() => {
    loadQuestionSets()
  }, [])

  const loadQuestionSets = async () => {
    try {
      const [toeic, school] = await Promise.all([
        questionSetService.getAll("TOEIC"),
        questionSetService.getAll("SCHOOL"),
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
            onClick={() => setFilterMode("all")}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterMode === "toeic" ? "active" : ""}`}
            onClick={() => setFilterMode("toeic")}
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
        <h4 className="quiz-card-title">{questionSet.title}</h4>
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
