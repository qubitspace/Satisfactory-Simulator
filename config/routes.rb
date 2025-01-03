Rails.application.routes.draw do
  
  get 'simulation/index'
  
  root 'simulation#index'
end

