export type { IAuthenticateRequest as ITodoAuthRequest } from '../../../../types/types'

export interface ICreateTodoBody {
  title: string
}

export interface IUpdateTodoBody {
  title?: string
  completed?: boolean
}
