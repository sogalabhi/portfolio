import './figures.css'
import PhoneFigure from './PhoneFigure'
import BasePlateFigure from './BasePlateFigure'
import PipelineFigure from './PipelineFigure'
import FlowFigure from './FlowFigure'
import ReviewFigure from './ReviewFigure'
import ProcessFigure from './ProcessFigure'
import MonitorFigure from './MonitorFigure'
import RetrievalFigure from './RetrievalFigure'

// projects.json `figure.type` -> the drawing for that project's plate
export const FIGURES = {
  phone: PhoneFigure,
  'base-plate': BasePlateFigure,
  pipeline: PipelineFigure,
  flow: FlowFigure,
  review: ReviewFigure,
  process: ProcessFigure,
  monitor: MonitorFigure,
  retrieval: RetrievalFigure,
}
