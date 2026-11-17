import './figures.css'
import PhoneFigure from './PhoneFigure'
import BasePlateFigure from './BasePlateFigure'
import PipelineFigure from './PipelineFigure'
import FlowFigure from './FlowFigure'

// projects.json `figure.type` -> the drawing for that project's plate
export const FIGURES = {
  phone: PhoneFigure,
  'base-plate': BasePlateFigure,
  pipeline: PipelineFigure,
  flow: FlowFigure,
}
