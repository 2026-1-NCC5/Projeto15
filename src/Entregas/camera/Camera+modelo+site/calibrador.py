import cv2
import numpy as np

# Variáveis globais para o estado do clique
pontos_clicados = []
imagem_exibicao = None

def capturar_clique(evento, x, y, flags, param):
    global pontos_clicados, imagem_exibicao
    if evento == cv2.EVENT_LBUTTONDOWN:
        if len(pontos_clicados) < 4:
            pontos_clicados.append([x, y])
            num = len(pontos_clicados)
            print(f"Ponto {num} registrado: ({x}, {y})")
            # Feedback visual
            cv2.circle(imagem_exibicao, (x, y), 6, (0, 0, 255), -1)
            cv2.putText(imagem_exibicao, str(num), (x + 10, y - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            cv2.imshow("Calibrador de Camera", imagem_exibicao)

def executar_calibracao(indice_camera=0):
    global imagem_exibicao
    camera = cv2.VideoCapture(indice_camera)
    for _ in range(10): sucesso, frame = camera.read()
    camera.release()
    
    if not sucesso:
        print("ERRO: Câmera não encontrada ou ocupada.")
        return None
        
    imagem_exibicao = frame.copy()
    cv2.imshow("Calibrador de Camera", imagem_exibicao)
    cv2.setMouseCallback("Calibrador de Camera", capturar_clique)
    
    print("Clique nos 4 cantos da mesa (sentido horário) e pressione ESPAÇO.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    return pontos_clicados

# Execução
pontos_finais = executar_calibracao(0)

if pontos_finais and len(pontos_finais) == 4:
    # SALVA AUTOMATICAMENTE PARA O CAMERA.PY LER
    np.savetxt("calibracao.txt", pontos_finais)
    print("\n✅ Calibração salva com sucesso em 'calibracao.txt'!")
else:
    print("\n❌ Calibração incompleta.")