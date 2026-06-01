<?php

namespace ProContent;

use Illuminate\Support\Str;
use Illuminate\Filesystem\Filesystem;

class Editor
{
    protected $config;
    protected $filesystem;

    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

    public function __construct($config = [])
    {
        $this->config = $config;
        $this->filesystem = new Filesystem();
    }

    public function allowedFile($filename)
    {
        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        return in_array(strtolower($ext), self::ALLOWED_EXTENSIONS);
    }

    public function saveImage($file)
    {
        if (!$file) {
            throw new \Exception('No file provided');
        }

        if (!$this->allowedFile($file->getClientOriginalName())) {
            throw new \Exception('File type not allowed');
        }

        $extension = $file->getClientOriginalExtension();
        $imageId = 'img_' . Str::random(12);
        $filename = $imageId . '.' . $extension;
        $dateFolder = date('Y/m/d');
        $uploadPath = 'uploads/' . $dateFolder;

        $this->filesystem->ensureDirectoryExists(public_path($uploadPath));
        $file->move(public_path($uploadPath), $filename);

        $filePath = public_path($uploadPath . '/' . $filename);
        $fileSize = $this->filesystem->size($filePath);
        $mimeType = $file->getMimeType();

        return [
            'image_id' => $imageId,
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'filepath' => $uploadPath . '/' . $filename,
            'url' => '/' . $uploadPath . '/' . $filename,
            'size' => $fileSize,
            'uploaded_at' => now()->toIso8601String(),
            'mime_type' => $mimeType
        ];
    }

    public function render($contentJson)
    {
        if (is_string($contentJson)) {
            $contentJson = json_decode($contentJson, true);
        }

        $html = '<div class="procontent-rendered">';

        if (isset($contentJson['blocks']) && is_array($contentJson['blocks'])) {
            foreach ($contentJson['blocks'] as $block) {
                $html .= $this->renderBlock($block);
            }
        } else {
            $html .= $this->renderBlock($contentJson);
        }

        $html .= '</div>';
        return $html;
    }

    public function renderBlock($block)
    {
        $type = $block['type'] ?? 'paragraph';
        $data = $block['data'] ?? [];

        switch ($type) {
            case 'paragraph':
                return '<p>' . htmlspecialchars($data['content'] ?? '', ENT_QUOTES, 'UTF-8') . '</p>';

            case 'heading':
                $level = $data['level'] ?? 1;
                return '<h' . $level . '>' . htmlspecialchars($data['content'] ?? '', ENT_QUOTES, 'UTF-8') . '</h' . $level . '>';

            case 'image':
                $alt = htmlspecialchars($data['alt'] ?? '', ENT_QUOTES, 'UTF-8');
                $src = $data['src'] ?? '';
                $alignment = $data['alignment'] ?? 'center';
                $caption = $data['caption'] ?? '';
                $captionHtml = $caption ? '<figcaption>' . htmlspecialchars($caption, ENT_QUOTES, 'UTF-8') . '</figcaption>' : '';
                return '<figure style="text-align: ' . $alignment . ';"><img src="' . $src . '" alt="' . $alt . '" />' . $captionHtml . '</figure>';

            case 'gallery':
                $images = $data['images'] ?? [];
                $gallery = '<div class="gallery">';
                foreach ($images as $img) {
                    $alt = htmlspecialchars($img['alt'] ?? '', ENT_QUOTES, 'UTF-8');
                    $src = $img['src'] ?? '';
                    $gallery .= '<div class="gallery-item"><img src="' . $src . '" alt="' . $alt . '" /></div>';
                }
                $gallery .= '</div>';
                return $gallery;

            case 'table':
                $rows = $data['rows'] ?? [];
                $table = '<table border="1"><tbody>';
                foreach ($rows as $row) {
                    $table .= '<tr>';
                    foreach ($row as $cell) {
                        $table .= '<td>' . htmlspecialchars((string) $cell, ENT_QUOTES, 'UTF-8') . '</td>';
                    }
                    $table .= '</tr>';
                }
                $table .= '</tbody></table>';
                return $table;

            case 'list':
                $items = $data['items'] ?? [];
                $listType = $data['list_type'] ?? 'ul';
                $tag = $listType === 'ul' ? 'ul' : 'ol';
                $list = '<' . $tag . '>';
                foreach ($items as $item) {
                    $list .= '<li>' . htmlspecialchars((string) $item, ENT_QUOTES, 'UTF-8') . '</li>';
                }
                $list .= '</' . $tag . '>';
                return $list;

            case 'quote':
                return '<blockquote>' . htmlspecialchars($data['content'] ?? '', ENT_QUOTES, 'UTF-8') . '</blockquote>';

            case 'code':
                $language = $data['language'] ?? 'plaintext';
                $content = htmlspecialchars($data['content'] ?? '', ENT_QUOTES, 'UTF-8');
                return '<pre><code class="language-' . $language . '">' . $content . '</code></pre>';

            case 'divider':
                return '<hr />';

            default:
                return '';
        }
    }

    public function validate($contentJson)
    {
        if (is_string($contentJson)) {
            try {
                $contentJson = json_decode($contentJson, true);
            } catch (\Exception $e) {
                return ['valid' => false, 'message' => 'Invalid JSON'];
            }
        }

        if (!is_array($contentJson)) {
            return ['valid' => false, 'message' => 'Content must be an array'];
        }

        return ['valid' => true, 'message' => 'Valid'];
    }
}
