import cv2
from ultralytics import YOLO 
from collections import Counter

modelo=YOLO('best.pt')

camera = cv2.VideoCapture(0)

print("Iniciando a camera...Pressione q para sair")


item_alvo = "bottle"

while True:
    sucesso, frame = camera.read()
    if not sucesso:
        print("Erro ao acessar a câmera!")
        break
    #cada frame que ela tire o modelo vai pensar sobre o processo vai identificar os itens e vai trazer um resultado, então ele roda em atividade sem parar    
    resultados = modelo(frame, stream = True)
    itens_frame = []
    frame_anotado = frame
    #contagem dos itens e identificação
    for resultado in resultados:
        frame_anotado = resultado.plot()
        classes_ids = resultado.boxes.cls.tolist()
        nomes = resultado.names
        for cls_id in classes_ids:
            itens_frame.append(nomes[int(cls_id)])
    contagem = Counter(itens_frame)
    #nomeação em cima do boundbox
    y_pos = 40
    cv2.rectangle(frame_anotado, (10,10),(350,150),(0,0),-1)

    for item, quantidade in contagem.items():
        texto_contagem = f"{item}: {quantidade} unidades"
        cv2.putText(frame_anotado,texto_contagem,(20,y_pos), cv2.FONT_HERSHEY_COMPLEX, 0.8, (255,255,255),2)
        y_pos += 30

    cv2.imshow("Contador de itens", frame_anotado)
    if(cv2.waitKey(1) & 0xFF == ord('q')):
        break
camera.release()
cv2.destroyAllWindows()
    

